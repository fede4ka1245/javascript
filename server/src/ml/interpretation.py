from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import json

EMOTION_LABELS = {
    0: "",
    1: "😃",
    2: "😭",
    3: "🤬 ",
    4: "🤔",
    5: "😲",
    6: "🤮",
    7: "😨",
    8: "😖",
    9: "🤦🏿‍♂️",
}

device = "cuda" if torch.cuda.is_available() else "cpu"


# определяем эмоциональный ли клип, чтобы это отдельно выделить
@torch.no_grad()
def predict_emotion(text: str, confidence: float) -> str:
    inputs = emotion_tokenizer(
        text, max_length=512, padding=True, truncation=True, return_tensors="pt"
    ).to(device)
    outputs = emotion_model(**inputs)
    predicted = torch.nn.functional.softmax(outputs.logits, dim=1)

    if torch.max(predicted, dim=1)[0] < confidence:
        predicted = [0]
    else:
        predicted = torch.argmax(predicted, dim=1).cpu().numpy()

    return EMOTION_LABELS[predicted[0]]


# получаем соответствующее эмоджи
def get_emotion(text):
    EMOTION_MODEL = "Djacon/rubert-tiny2-russian-emotion-detection"

    emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL, device_map=device)
    emotion_model = AutoModelForSequenceClassification.from_pretrained(
        EMOTION_MODEL, device_map=device
    )

    emotion = predict_emotion(text, confidence=0.6)

    return emotion


def get_interpretation(text, video_path):
    interpretation = []
    
    # часть информации о видео лежит в данном json файле
    with open("viral_video_stats.json") as f:
        current_part_info = json.load(f)[video_path]
    
    # проверяем клип на эмоции
    emotion = get_emotion(text)
    if emotion != "":
        interpretation.append(f"Эмоциональное видео. Главная эмоция - {emotion}")
    
    # проверяем наличие лица в видео, чтобы выделить это отдельно
    if current_path_info["is_face_detected"]:
        interpretation.append(f"На видео присутствуют лица")
        
    # проверяем насколько гроское видео, чтобы отедельно это как-то выделить
    if current_path_info["percentage_of_loud"] > 80:
        interpretation.append(f"Аудио в клипе громкое")
    
    # тишина тоже может быть признаком виральности, следовательно проверить на ней тоже надо
    if current_path_info["percentage_of_loud"] < 10:
        interpretation.append(f"Аудио в клипе тихое")
    
    return interpretation
        
