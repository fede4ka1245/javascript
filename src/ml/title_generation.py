from transformers import AutoTokenizer, EncoderDecoderModel
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

model_name = "IlyaGusev/rubert_telegram_headlines"
tokenizer = AutoTokenizer.from_pretrained(model_name, do_lower_case=False, do_basic_tokenize=False, strip_accents=False, device_map=device)
model = EncoderDecoderModel.from_pretrained(model_name, device_map=device)


def generate_title(text):
    input_ids = tokenizer(
        [text],
        add_special_tokens=True,
        max_length=256,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )["input_ids"]

    output_ids = model.generate(
        input_ids=input_ids.to(device),
        max_length=64,
        no_repeat_ngram_size=3,
        num_beams=10,
        top_p=0.95
    )[0]

    headline = tokenizer.decode(output_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True)
    return headline
