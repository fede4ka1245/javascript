# https://www.modelscope.cn/models/iic/cv_clip-it_video-summarization_language-guided_en
import os
import random
import time
from concurrent.futures.process import ProcessPoolExecutor

import cv2
from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks
import moviepy.editor as mp
from tqdm import tqdm
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

from rolling_window import get_bboxes, add_objects, update_dominant, prepare_for_short
import concurrent.futures


def create_viral_video(index, video_path):
    start_t, end_t = index['timestamps'][0], index['timestamps'][1]
    h1, m1, s1 = start_t.split(':')
    t1 = int(h1) * 60 * 60 + int(m1) * 60 + float(s1)
    h2, m2, s2 = end_t.split(':')
    t2 = int(h2) * 60 * 60 + int(m2) * 60 + float(s2)
    ffmpeg_extract_subclip(video_path,
                           t1, t2,
                           targetname=f"output/output_{index}.mp4")

    max_shift = 10
    MAX_TRACK_LENGTH = 1000
    VIDEO_PATH = f"output/output_{index}.mp4"
    SAVE_PATH = f"total/output_{index}.mp4"

    t = time.time()
    cap = cv2.VideoCapture(VIDEO_PATH)
    ret, frame = cap.read()

    # defect videos filtering
    if cap.get(cv2.CAP_PROP_FRAME_WIDTH) == cap.get(cv2.CAP_PROP_FRAME_HEIGHT) == 720:
        os.system(f'echo "y" | ffmpeg -i "{VIDEO_PATH}" -vf "scale=1280:720" -crf 21 tmp.mp4 > /dev/null')
        cap = cv2.VideoCapture('tmp.mp4')
        ret, frame = cap.read()

    total_video_shape = frame.shape[0], int(frame.shape[0] / 16 * 9)
    current_video_shape = frame.shape[:2]

    # print(current_video_shape, total_video_shape)

    # dominant
    dominant_color = update_dominant(frame)

    fourcc = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
    total_short = cv2.VideoWriter(SAVE_PATH, fourcc, cap.get(cv2.CAP_PROP_FPS), total_video_shape[::-1])
    # segm_video = cv2.VideoWriter("segm.mp4", fourcc, cap.get(cv2.CAP_PROP_FPS), frame.shape[:2])

    current_block_id = 0
    objects_on_frame = {
        0: [[0, 0, int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))], 0, -100000000,
            1000]
    }
    count = 0

    while cap.isOpened():
        ret, frame = cap.read()

        if frame is None:
            break

        bboxes = get_bboxes(frame)

        objects_on_frame = add_objects(objects_on_frame, bboxes, max_shift)
        # print(current_block_id, objects_on_frame)

        if current_block_id not in objects_on_frame:
            # print(count, 'disappeared without a trace', current_block_id)
            current_block_id = random.choice(list(objects_on_frame.keys()))
            dominant_color = update_dominant(frame)

        if objects_on_frame[current_block_id][1] >= 200 and len(objects_on_frame) > 1:
            # print(count, 'change', current_block_id)

            objects_on_frame[current_block_id][1] = 0

            next_segments = list(objects_on_frame.keys())
            next_segments.remove(current_block_id)
            current_block_id = random.choice(next_segments)

            dominant_color = update_dominant(frame)

        cropped_frame = prepare_for_short(frame, objects_on_frame[current_block_id][0],
                                          current_video_shape, total_video_shape, dominant_color)
        objects_on_frame[current_block_id][1] += 1
        total_short.write(cropped_frame)
        count += 1

        old_frame = frame.copy()

    cap.release()
    total_short.release()
    # segm_video.release()

    # add audio to saved video
    audio = mp.VideoFileClip(VIDEO_PATH).audio
    video1 = mp.VideoFileClip(SAVE_PATH)
    final = video1.set_audio(audio)
    final.write_videofile(f"output/generated_output_{index}.mp4", codec="libx264", audio_codec="aac")

    print(time.time() - t)


def main(video_path):
    summarization_pipeline = pipeline(Tasks.video_summarization, model='cv_googlenet_pgl-video-summarization/')
    result = summarization_pipeline(video_path)
    print(f'video summarization output: {result}.')

    os.makedirs('output', exist_ok=True)
    os.makedirs('total', exist_ok=True)

    with ProcessPoolExecutor(max_workers=4) as executor:
        # Запуск задачи параллельно
        results = list(executor.map(create_viral_video, result['output'], [video_path for _ in range(len(result["output"]))]))
    
    clip_paths = [f"output/generated_output_{index}.mp4" for index in result["output"]]

    print("ready")
    return clip_paths


# video_path = '../viral_video/videos/0a1bd95990029433d45dd0a7b15d9b50.mp4'
# # video_path = '../Новосибирс_отчетник.mp4'

# summarization_pipeline = pipeline(Tasks.video_summarization, model='cv_googlenet_pgl-video-summarization/')
# result = summarization_pipeline(video_path)
# print(f'video summarization output: {result}.')

# os.makedirs('output', exist_ok=True)
# os.makedirs('total', exist_ok=True)


# for index in tqdm(result['output']):
#     create_viral_video(index)

print('READY')
