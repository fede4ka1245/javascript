import whisper
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re
from copy import copy

WHISPER_MODEL = "medium"

# модель для определния эмоции текста
EMOTION_MODEL = "Djacon/rubert-tiny2-russian-emotion-detection"

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

whisper_model = whisper.load_model(WHISPER_MODEL, device=device)
emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL, device_map=device)
emotion_model = AutoModelForSequenceClassification.from_pretrained(
    EMOTION_MODEL, device_map=device
)


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


def split_text_by_sentences(text: str) -> list[str]:
    return re.findall(r"[^.!?]+[.!?]", text)


def get_timestamps_words_array(segments: list[dict]) -> list[dict]:
    result = []

    for segment in segments:
        for word in segment["words"]:
            result.append(
                {"word": word["word"], "start": word["start"], "end": word["end"], "length": len(word["word"])}
            )

    return result


# транскрибируем текст с помощью openai-whisper, выделяем отдельно сегменты для обозначения эмоций и слова отдельно с timestamp, чтобы вставлять их титрами в видео в соответствии с таймингами
def get_transcribed_text(path_to_file: str) -> (str, list[dict]):
    result = whisper_model.transcribe(word_timestamps=True, audio=path_to_file)
    text = result["text"]
    segments = [
        {
            "text": segment["text"],
            "start": segment["start"],
            "end": segment["end"],
            "length": len(segment["text"]),
            "words": segment["words"],
        }
        for segment in result["segments"]
    ]
    timestamps_words = get_timestamps_words_array(segments)

    return text, segments, timestamps_words


# алгоритм для вставки эмоджи в сегменты
def update_segments(segments: list[dict], emoji_positions: list[int], emojies: list[str], text_def="text") -> list[dict]:
    current_pos = 0
    
    print(emoji_positions, emojies)

    for segment in segments:
        if not emojies:
            return segments

        while emoji_positions[0] < current_pos + segment["length"]:
            segment["length"] += 1
            segment[text_def] = segment[text_def][:emoji_positions[0] - current_pos] + emojies[0] + segment[text_def][emoji_positions[0] - current_pos:]
            emojies.pop(0)
            emoji_positions.pop(0)
            
            if not emojies:
                return segments

        current_pos += segment["length"]

    return segments


# вставляем эмоджи в текст по контексту
def insert_emojies(
    splitted_text: list[str], context_sentences: int = 2, confidence: float = 0.7
) -> (str, list[int], list[str]):
    current_pos = 0
    emoji_positions = []
    emojies = []
    text_with_emojies = ""

    for i, sentence in enumerate(splitted_text):
        emoji = predict_emotion(
            "".join(splitted_text[max(0, i - 2) : i + 1]), confidence=confidence
        )

        if emoji != "":
            emoji_positions.append(current_pos + len(sentence) - 1)
            emojies.append(emoji)

        current_pos += len(sentence) + len(emoji)
        text_with_emojies += sentence[:-1] + emoji + sentence[-1]

    return text_with_emojies, emoji_positions, emojies


def inference(path_to_file: str) -> dict:
    transcribed_text, segments, timestamps_words = get_transcribed_text(path_to_file)
    splitted_text = split_text_by_sentences(transcribed_text)
    raw_text, emoji_positions, emojies = insert_emojies(splitted_text)
    segments = update_segments(segments, copy(emoji_positions), copy(emojies))
    timestamps_words = update_segments(timestamps_words, copy(emoji_positions), copy(emojies), text_def="word")
    return {"text": raw_text, "segments": segments, "words": timestamps_words}