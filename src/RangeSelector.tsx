import * as React from "react";
import {
   Slider,
   Stack,
   TextField,
} from "@mui/material";
interface RangeSelectorProps {
   onChange?: (newVal: [number, number]) => void;
   minVal?: number;
   maxVal?: number;
}
export default function RangeSelector({ onChange, minVal = 0, maxVal = 999 }: RangeSelectorProps) {
   const [sliderVal, setSliderVal] = React.useState<[number, number]>([minVal, maxVal]);
   const [minInp, setMinInp] = React.useState(minVal);
   const [maxInp, setMaxInp] = React.useState(maxVal);
   const changeValues = (newVal: [number, number]) => {
      setSliderVal(newVal);
      setMinInp(newVal[0]);
      setMaxInp(newVal[1]);
      if (onChange) onChange(newVal);
   }

   return (
      <Stack direction="row" spacing={2} alignItems="center">
         <TextField
            label="Min"
            type="number"
            size="small"
            value={minInp}
            onChange={(e) => setMinInp(Number(e.target.value))}
            onBlur={() => {
               const clampedVal = Math.min(minInp, sliderVal[1]);
               changeValues([clampedVal, sliderVal[1]]);
            }}
         />

         <Slider
            value={sliderVal}
            onChange={(e, v) => {
               changeValues(v as [number, number]);
            }
            }
            min={minVal}
            max={maxVal}
            disableSwap
            sx={{ mx: 1 }}
         />

         <TextField
            label="Max"
            type="number"
            size="small"
            value={maxInp}
            onChange={(e) => setMaxInp(Number(e.target.value))}
            onBlur={() => {
               const clampedVal = Math.max(Number(maxInp), sliderVal[0]);
               changeValues([sliderVal[0], clampedVal]);
            }}
         />

      </Stack>
   );
}
