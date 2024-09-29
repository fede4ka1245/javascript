import Layer from "./Layer";
import {blankTextSetter} from "../../consts/layerConsts";

const getTextWidth = (ctx, text) => ctx?.measureText?.(text)?.width;

const splitWordToLinesByWidth = (word, maxWidth, ctx) => {
  const lines = [];
  let currentLine = "";
  let currentLineWidth = 0;
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    const cWidth = getTextWidth(ctx, c);
    if (getTextWidth(ctx, currentLine + c) > maxWidth) {
      lines.push(currentLine);
      currentLine = "";
      currentLineWidth = 0;
    }
    currentLine += c;
    currentLineWidth += cWidth;
  }
  lines.push(currentLine);
  return lines;
};

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  const whitespaceMatcher = /^\s$/;
  const otherDelimiters = "-?";
  const space = " ";
  const spaceWidth = getTextWidth(ctx, space);

  let currentLine = "";
  let currentLineWidth = 0;
  let isInWord = false;
  let wordStartIdx = undefined;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];

    if ((c.match(whitespaceMatcher) || otherDelimiters.includes(c)) && isInWord) {
      isInWord = false;
      let word = text.substring(wordStartIdx, i);
      let wordWidth = getTextWidth(ctx, word);
      if (wordWidth + currentLineWidth <= maxWidth) {
        currentLine += word;
        currentLineWidth += wordWidth;
      } else {
        if (currentLine != '') {
          lines.push(currentLine);
        }
        let splittedWord = splitWordToLinesByWidth(word, maxWidth);
        currentLine = splittedWord.pop();
        currentLineWidth = getTextWidth(ctx, currentLine);
        if (splittedWord.length > 0) {
          lines.push(...splittedWord);
        }
      }
    }

    if (c == '\r') {
      continue;
    }
    if (c == '\n') {
      lines.push(currentLine);
      currentLine = "";
      currentLineWidth = 0;
      continue;
    }
    if (c.match(whitespaceMatcher)) {
      if (currentLineWidth + spaceWidth > maxWidth) {
        continue;
      }
      currentLineWidth += spaceWidth;
      currentLine += space;
      continue;
    }
    if (otherDelimiters.includes(c)) {
      let currentCharWidth = getTextWidth(ctx, c);
      if (currentCharWidth + currentLineWidth <= maxWidth) {
        currentLineWidth += currentCharWidth;
        currentLine += c;
        continue;
      }
      lines.push(currentLine);
      currentLine = c;
      currentLineWidth = currentCharWidth;
      continue;
    }

    if (!isInWord) {
      isInWord = true;
      wordStartIdx = i;
    }
  }
  if (isInWord) {
    let word = text.substring(wordStartIdx, text.length);
    let wordWidth = getTextWidth(ctx, word);
    if (wordWidth + currentLineWidth <= maxWidth) {
      currentLine += word;
      currentLineWidth += wordWidth;
    } else {
      if (currentLine != '') {
        lines.push(currentLine);
      }
      let splittedWord = splitWordToLinesByWidth(word, maxWidth);
      currentLine = splittedWord.pop();
      currentLineWidth = getTextWidth(ctx, currentLine);
      lines.push(...splittedWord);
    }
  }
  lines.push(currentLine);
  return lines;
}

const getTextStartX = ({ textAlign, maxWidth }) => {
  if (textAlign === 'left') {
    return 0;
  } else {
    if (textAlign === 'right') {
      return maxWidth;
    } else {
      return maxWidth / 2;
    }
  }
}

const drawText = ({ ctx, text, fontName, maxWidth, textAlign, fontSize, fontWeight = 'normal' }) => {
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  ctx.textAlign = textAlign;
  ctx.fontName = fontName;
  ctx.font = `${ fontWeight } ${ fontSize }px ${ fontName }`;

  const textStartX = Number(getTextStartX({ textAlign, maxWidth }));
  const lines = wrapText(ctx, text, maxWidth, fontSize);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textStartX, (i * fontSize));
  }
};

export default class TextLayer extends Layer {
  constructor(params) {
    super(params);
    this.props.textProps = { ...blankTextSetter, ...params.textProps };
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.position = 'absolute';
    textarea.style.outline = 'none';
    textarea.style.border = 'none';
    textarea.style.height = '100%';
    textarea.style.background = 'transparent';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1';

    textarea.onmousedown = () => textarea.focus();
    textarea.oninput = () => {
      const { height: boxHeight } = this.transformable.boxContent.getBoundingClientRect();

      this.transformable.minHeight = textarea.scrollHeight;
      this.transformable.resize(this.transformable.getCurrnetTransform().width, textarea.scrollHeight);
    }
    textarea.textContent = '';
    this.textarea = textarea;

    this.transformable.boxContent.append(textarea);
    textarea.onmousedown = () => textarea.focus();
    this.setTextProps(this.props.textProps);
  }

  setTextProps(textProps) {
    this.textarea.style.fontSize = textProps.fontSize + 'px';
    this.textarea.style.color = textProps.color;
    this.textarea.style.textAlign = textProps.textAlign;
    this.textarea.style.fontFamily = 'Arial';
    this.textarea.textContent = this.props.textProps.text;
  }

  render(canvas, videoTiming, isRecording = true) {
    const ctx = canvas.getContext('2d');

    if (this._isRenderingTime(videoTiming)) {
      this.transformable.box.style.display = 'unset';
      const { x, y, height, width } = this._getObjectInternalTransform({
        width: this.textarea.getBoundingClientRect().width,
        height: 80,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });

      if (!width || !height || !this.isRecording) {
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext('2d');

      let fontSize = 90 * this.getLayerCoefs().yCoef;
      let fontName = "Arial";
      let textAlign = 'center';

      drawText({ ctx: tempContext, text: this.textarea.value, fontName, maxWidth: width, fontSize, textAlign })

      ctx.drawImage(tempCanvas, x, y, width, height);
    } else {
      this.transformable.box.style.display = 'none';
    }
  }
}