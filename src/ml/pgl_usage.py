import json
import os
import random
import time
from concurrent.futures.process import ProcessPoolExecutor

import cv2
from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks
import moviepy.editor as mp
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

from rolling_window import get_bboxes, add_objects, update_dominant, prepare_for_short, get_video_length


def timestamp_to_seconds(timestamp):
    h1, m1, s1 = timestamp.split(':')
    return int(h1) * 60 * 60 + int(m1) * 60 + float(s1)


def create_viral_video(index, main_video_length, video_path):
    """
    Создание вертикального формата видео используя выделенный фрагмент из видео
    используется трекинг объектов, автоматический выбор фона
    :param index: словарь содержащий начало и конец в секундах ключевого фрагмента
    на видео
    :return:
    """

    t1, t2 = timestamp_to_seconds(index['timestamps'][0]), timestamp_to_seconds(index['timestamps'][1])
    t1 = max(t1 - (t2 - t1) * 0.3, 0)
    t2 = min(t2 + (t2 - t1) * 0.3, main_video_length)

    # вырезаем из видео ключевой фрагмент и сохраняем отдельно
    ffmpeg_extract_subclip(video_path, t1, t2,
                           targetname=f"output/output_{index}.mp4")

    max_shift = 10
    VIDEO_PATH = f"output/output_{index}.mp4"
    SAVE_PATH = f"total/output_{index}.mp4"
    is_object_tracked = False

    t = time.time()
    cap = cv2.VideoCapture(VIDEO_PATH)
    ret, frame = cap.read()

    # в случае если есть проблемы с открыванием файла преобразуем его в другой формат
    if cap.get(cv2.CAP_PROP_FRAME_WIDTH) == cap.get(cv2.CAP_PROP_FRAME_HEIGHT) == 720:
        os.system(f'echo "y" | ffmpeg -i "{VIDEO_PATH}" -vf "scale=1280:720" -crf 21 "tmp/tmp_{index}.mp4" > /dev/null')
        cap = cv2.VideoCapture(f'tmp/tmp_{index}.mp4')
        ret, frame = cap.read()

    total_video_shape = frame.shape[0], int(frame.shape[0] / 16 * 9)
    current_video_shape = frame.shape[:2]

    # выбор доминантного цвета и фото из видео
    dominant_color = update_dominant(frame)

    # изменение количества фпс в вирального видео
    fps_in = cap.get(cv2.CAP_PROP_FPS)
    fps_out = min(fps_in, 15)

    index_in = -1
    index_out = -1

    fourcc = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
    total_short = cv2.VideoWriter(SAVE_PATH, fourcc, fps_out, total_video_shape[::-1])

    # создание объекта для трекинга лиц
    current_block_id = 0
    objects_on_frame = {
        0: [[0, 0, int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))],
            200, -100000000, 1000]
    }
    count = 0

    print('generating started', fps_in, fps_out, frame.shape)

    while True:
        success = cap.grab()
        if not success: break
        index_in += 1

        # пропускаем изображение, чтобы попасть в фпс
        out_due = int(index_in / fps_in * fps_out)
        if out_due <= index_out:
            continue

        success, frame = cap.retrieve()
        if not success: break
        index_out += 1

        # находим на изображении координаты лица
        bboxes = get_bboxes(frame)

        # добавляем новые окна в трекинг
        objects_on_frame = add_objects(objects_on_frame, bboxes, max_shift)

        if len(objects_on_frame) > 1:
            is_object_tracked = True

        # если объект трекинга пропал, то выбираем другой
        if current_block_id not in objects_on_frame:
            current_block_id = random.choice(list(objects_on_frame.keys()))
            dominant_color = update_dominant(frame)

        # если объект слишком долго на экране, то меняем его
        if objects_on_frame[current_block_id][1] >= 200 and len(objects_on_frame) > 1:
            objects_on_frame[current_block_id][1] = 0

            next_segments = list(objects_on_frame.keys())
            next_segments.remove(current_block_id)
            current_block_id = random.choice(next_segments)

            dominant_color = update_dominant(frame)

        # обрезаем кадр по объекту трекинга и преобразуем в вертикальный формат
        cropped_frame = prepare_for_short(frame, objects_on_frame[current_block_id][0],
                                          current_video_shape, total_video_shape, dominant_color)
        objects_on_frame[current_block_id][1] += 1
        total_short.write(cropped_frame)
        count += 1

    print('generating finished', time.time() - t)

    t2 = time.time()

    cap.release()
    total_short.release()

    # добавляем аудио в итоговое видео
    audio = mp.VideoFileClip(VIDEO_PATH).audio
    video1 = mp.VideoFileClip(SAVE_PATH)
    final = video1.set_audio(audio)
    final.write_videofile(f"output/generated_output_{index}.mp4", codec="libx264", audio_codec="aac")

    print('saving audio ready', time.time() - t2)

    print('total', time.time() - t)

    return is_object_tracked


def main(video_path):
    # запускаем модель для поиска ключевых фрагментов видео
    summarization_pipeline = pipeline(Tasks.video_summarization, model='cv_googlenet_pgl-video-summarization/')
    result = summarization_pipeline(video_path)

    # высчитываем итоговое количество виральных видео
    max_viral_videos_count = min(1, int(get_video_length(video_path) / 60 / 4))

    result['output'].sort(key=lambda x: -(timestamp_to_seconds(x['timestamps'][1]) -
                                        timestamp_to_seconds(x['timestamps'][0])))

    selected_frames = result['output'][:min(len(result['output']), max_viral_videos_count)]

    os.makedirs('output', exist_ok=True)
    os.makedirs('total', exist_ok=True)

    main_video_length = get_video_length(video_path)

    # Создание ProcessPoolExecutor с 4 рабочими процессами
    with ProcessPoolExecutor(max_workers=4) as executor:
        # Запуск создания вирального видео параллельно
        results = list(executor.map(create_viral_video, selected_frames,
                                    [main_video_length] * len(selected_frames),
                                    [video_path] * len(selected_frames)))

    video_stats = {}
    for i, index in enumerate(selected_frames):
        video_stats[str(index)] = {
            'is_face_detected': results[i],
            'percentage_of_loud': 50
        }

    with open('viral_video_stats.json', 'w') as f:
        json.dump(results, f)
    
    clip_paths = [f"output/generated_output_{index}.mp4" for index in result["output"]]

    print("ready")
    return clip_paths
