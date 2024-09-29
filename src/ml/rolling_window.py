import os
import time
from math import floor, ceil

import cv2
import moviepy.editor as mp
import random
import numpy as np


def get_overlap(box1, box2):
    """
    Implement the relative overlap between box1 and box2

    Arguments:
        box1 -- first box, numpy array with coordinates (ymin, xmin, ymax, xmax)
        box2 -- second box, numpy array with coordinates (ymin, xmin, ymax, xmax)
    """
    # ymin, xmin, ymax, xmax = box

    y11, x11, y21, x21 = box1
    y12, x12, y22, x22 = box2

    yi1 = max(y11, y12)
    xi1 = max(x11, x12)
    yi2 = min(y21, y22)
    xi2 = min(x21, x22)
    inter_area = max(((xi2 - xi1) * (yi2 - yi1)), 0)

    box1_area = (x21 - x11) * (y21 - y11)
    box2_area = (x22 - x12) * (y22 - y12)

    # compute the overlapped area w.r.t area of the smallest bounding box
    overlap = inter_area / min(box1_area, box2_area)
    return overlap


def get_bboxes(image):
    face_classifier = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    face = face_classifier.detectMultiScale(
        gray_image, scaleFactor=1.1, minNeighbors=15, minSize=(80, 80)
    )

    bboxes = []
    for (x, y, w, h) in face:
        if image.shape[0] // 2 > y:
            bboxes.append([x - 100, y, x + w + 100, y + h])

    return bboxes


def prepare_for_short(img, shape, current_video_shape, total_video_shape, dominant_color):
    """
    обрезание фрейма в формат вертикального видео по объекту трекинга
    :param img: текущее изображение
    :param shape: размер исходного видео
    :param current_video_shape: размер вирального видео
    :param total_video_shape:
    :param dominant_color: цвет фона в формате ргб
    :return:
    """
    x1, y1, x2, y2 = shape

    if x1 == y1 == 0 and x2 == current_video_shape[1] and y2 == current_video_shape[0]:
        if x2 > 1000:
            img = img[:, 200:-200, :]

        img_w, img_h = img.shape[:2]
        min_k = min(total_video_shape[1] / img_h, total_video_shape[0] / img_w)
        img = cv2.resize(img, (int(img_h * min_k), int(img_w * min_k)))
    else:
        x_diff = (total_video_shape[1] - (x2 - x1)) // 2
        x_left = max(0, shape[0] - x_diff)
        x_right = x_left + total_video_shape[1]
        img = img[:, x_left:x_right, :]

        y_diff = (total_video_shape[0] - (y2 - y1)) // 2
        y_left = max(0, shape[1] - y_diff)
        y_right = y_left + total_video_shape[0]
        img = img[y_left:y_right, :, :]

    x_diff = (total_video_shape[0] - img.shape[0]) / 2
    y_diff = (total_video_shape[1] - img.shape[1]) / 2

    img = cv2.copyMakeBorder(img, ceil(x_diff), floor(x_diff), ceil(y_diff), floor(y_diff),
                             cv2.BORDER_CONSTANT, value=dominant_color)
    return img


def add_objects(queue, boxes, max_shift):
    """
    треккинг объектов на видео
    :param queue: объект который хранит историю по всем объектам на фото
    :param boxes: координаты новых распознанных объектов
    :param max_shift: как долго может храниться объект
    :return: новый объект трекинга
    """
    found_same = {x: False for x in queue}
    box_to_id = [-1] * len(boxes)
    new_queue = dict()
    for j in range(len(boxes)):
        found = False
        for queue_id in queue:
            if queue_id != 0 and get_overlap(boxes[j], queue[queue_id][0]) > 0.9:
                found = True

                # spoofing
                for k in range(4):
                    if boxes[j][k] > queue[queue_id][0][k]:
                        queue[queue_id][0][k] = min(boxes[j][k], queue[queue_id][0][k] + max_shift)
                    else:
                        queue[queue_id][0][k] = max(boxes[j][k], queue[queue_id][0][k] - max_shift)

                queue[queue_id][3] += 1
                queue[queue_id][2] = 0 if queue_id != 0 else -1000000
                found_same[queue_id] = True
                box_to_id[j] = queue_id
                break
        if not found:
            new_queue[len(queue)] = [boxes[j], 1, 0, 0]  # bbox, count_found, count_not, count_showed

    for queue_id in queue:
        if not found_same[queue_id]:
            queue[queue_id][2] += 1
        if queue[queue_id][2] < 10:
            new_queue[queue_id] = queue[queue_id].copy()
    queue = new_queue.copy()
    return queue


def update_dominant(img):
    # поиск доминирующего видео на фото

    pixels = np.float32(img.reshape(-1, 3))
    n_colors = 5
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 200, .1)
    flags = cv2.KMEANS_RANDOM_CENTERS
    _, labels, palette = cv2.kmeans(pixels, n_colors, None, criteria, 10, flags)
    _, counts = np.unique(labels, return_counts=True)
    dominant = palette[np.argmax(counts)]
    return list(map(int, dominant))


def get_video_length(filename):
    video = cv2.VideoCapture(filename)
    frame_count = video.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = video.get(cv2.CAP_PROP_FPS)
    duration = frame_count / fps
    return duration
