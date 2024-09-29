from itertools import groupby
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer

device ="cuda" if torch.cuda.is_available() else "cpu"

model_name = "0x7194633/keyt5-large" # or 0x7194633/keyt5-base
tokenizer = T5Tokenizer.from_pretrained(model_name, device_map=device)
model = T5ForConditionalGeneration.from_pretrained(model_name, device_map=device)

def generate(text, **kwargs):
    inputs = tokenizer(text, return_tensors='pt')
    with torch.no_grad():
        hypotheses = model.generate(**inputs.to(device), num_beams=5, **kwargs)
    s = tokenizer.decode(hypotheses[0], skip_special_tokens=True)
    s = s.replace('; ', ';').replace(' ;', ';').lower().split(';')[:-1]
    s = [el for el, _ in groupby(s)]
    return s