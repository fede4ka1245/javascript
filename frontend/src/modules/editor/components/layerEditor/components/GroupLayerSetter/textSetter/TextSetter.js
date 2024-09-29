import React, {useCallback} from 'react';
import Input from "../../../../../../../ui/input/Input";
import {FormControlLabel, FormGroup, Grid, RadioGroup, Typography} from "@mui/material";
import InputNumber from "../../../../../../../components/inputNumber/InputNumber";
import Radio from "../../../../../../../ui/radio/Radio";
import InputColorPicker from "../../../../../../../components/inputColorPicker/InputColorPicker";
import Checkbox from "../../../../../../../ui/checkbox/Checkbox";

const textAlign = [
  'start',
  'center',
  'end'
]

const fonts = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Titan One'
]

const textDecorations = [
  'bold',
  'italic'
]

const TextSetter = ({ textSetterState, setTextSetterState }) => {
  const onTextAlignSet = useCallback((_, textAlign) => {
    setTextSetterState({
      ...textSetterState,
      textAlign
    })
  }, [textSetterState]);

  const onColorSet = useCallback((event) => {
    setTextSetterState({
      ...textSetterState,
      color: event.target.value
    })
  }, [textSetterState]);

  const onTextChange = useCallback((event) => {
    setTextSetterState({
      ...textSetterState,
      text: event.target.value
    })
  }, [textSetterState]);


  const onFontSizeChange = useCallback((value) => {
    setTextSetterState({
      ...textSetterState,
      fontSize: value
    })
  }, [textSetterState]);

  const onFontSet = useCallback((_, fontFamily) => {
    setTextSetterState({
      ...textSetterState,
      fontFamily
    })
  }, [textSetterState]);

  const onStrokeWidthChange = useCallback((value) => {
    setTextSetterState({
      ...textSetterState,
      strokeWidth: value
    });
  }, [textSetterState]);

  const onStrokeColorChange = useCallback((event) => {
    setTextSetterState({
      ...textSetterState,
      strokeColor: event.target.value
    });
  }, [textSetterState]);

  return (
    <>
      <Input
        fullWidth
        size={'small'}
        type={'outline'}
        label={'Text'}
        onChange={onTextChange}
        value={textSetterState.text}
      />
      <Grid mt={'var(--space-md)'}>
        <InputNumber
          fullWidth
          min={0}
          type={'outline'}
          label={'Font Size'}
          onChange={onFontSizeChange}
          value={textSetterState.fontSize}
        />
      </Grid>
      <Grid mt={'var(--space-md)'}>
        <InputColorPicker
          value={textSetterState.color}
          onChange={onColorSet}
        />
      </Grid>
      <Grid mt={'var(--space-md)'}>
        <Typography
          fontSize={'var(--font-size-sm)'}
          fontWeight={'bold'}
          color={'var(--text-secondary-color)'}
        >
          Text Align
        </Typography>
        <RadioGroup
          row
          value={textSetterState.textAlign}
          onChange={onTextAlignSet}
        >
          {textAlign.map((align) => (
            <FormControlLabel
              key={align}
              value={align}
              control={<Radio />}
              label={<Typography
                fontSize={'var(--font-size-sm)'}
                color={'var(--hint-color)'}
              >
                {align}
              </Typography>}
            />
          ))}
        </RadioGroup>
        <Grid mt={'calc(var(--space-md) * 2)'}>
          <InputNumber
            step={0.2}
            min={0}
            fullWidth
            type={'outline'}
            label={'Stroke width'}
            value={textSetterState.strokeWidth}
            onChange={onStrokeWidthChange}
          />
        </Grid>
        <Grid mt={'var(--space-md)'}>
          <InputColorPicker
            label={'Stroke color'}
            value={textSetterState.strokeColor}
            onChange={onStrokeColorChange}
          />
        </Grid>
        <Grid mt={'var(--space-md)'}>
          <Typography
            fontSize={'var(--font-size-sm)'}
            fontWeight={'bold'}
            color={'var(--text-secondary-color)'}
          >
            Font Family
          </Typography>
          <RadioGroup
            row
            onChange={onFontSet}
            value={textSetterState.fontFamily}
          >
            {fonts.map((font) => (
              <FormControlLabel
                key={font}
                value={font}
                control={<Radio />}
                label={<Typography
                  fontFamily={font}
                  fontSize={'var(--font-size-sm)'}
                  color={'var(--hint-color)'}
                >
                  {font}
                </Typography>}
              />
            ))}
          </RadioGroup>
        </Grid>
        <Grid mt={'var(--space-md)'}>
          <Grid>
            <Typography
              fontSize={'var(--font-size-sm)'}
              fontWeight={'bold'}
              color={'var(--text-secondary-color)'}
            >
              Text Decorations
            </Typography>
            <FormGroup>
              {textDecorations.map((value) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={textSetterState.textDecorations.includes(value)}
                      onChange={() => {
                        if (textSetterState.textDecorations.includes(value)) {
                          setTextSetterState({ ...textSetterState, textDecorations: textSetterState.textDecorations.filter((target) => target !== value)})
                        } else {
                          setTextSetterState({ ...textSetterState, textDecorations: [...textSetterState.textDecorations, value] })
                        }
                      }}
                      name={value}
                    />
                  }
                  label={<Typography
                    fontSize={'var(--font-size-sm)'}
                    color={'var(--hint-color)'}
                  >
                    {value}
                  </Typography>}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default TextSetter;