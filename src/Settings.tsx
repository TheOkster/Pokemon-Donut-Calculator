import { useState } from 'react'
import { Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Slider, Stack, TextField } from '@mui/material'
import RangeSelector from './RangeSelector'
import { flavors, type Flavor } from './App';
import "./Settings.css"
export interface BerryDict {
   [key: string]: Record<string, number>;
}

export interface BerryQuantDict {
   [key: string]: number;
}

interface BerryProps {
   starRange: [number, number];
   flavorValues: {
      [key: string]: [number, number];
   };
   maxBerries: number;
   berryQuants: BerryQuantDict;
   berryStats: BerryDict;
   enableRainbow: boolean;
   rainbowFlavors: [Flavor, Flavor],
   maxResults: number,
   onStarRangeChange?: (starRange: [number, number]) => void;
   onFlavorValuesChange?: (flavor: string, newValue: [number, number]) => void;
   onBerryQuantsChange?: (berry: string, newQuant: number) => void;
   onMaxBerriesChange?: (maxBerries: number) => void;
   onRainbowChange?: (rainbowEnabled: boolean) => void;
   onRainbowFlavorChange?: (rainbowFlavors: [Flavor, Flavor]) => void;
   onMaxResultsChange: (maxResults: number) => void;
}
export default function Settings({ starRange, maxBerries, berryQuants, berryStats, enableRainbow, rainbowFlavors, maxResults, onStarRangeChange, onFlavorValuesChange, onBerryQuantsChange, onMaxBerriesChange, onRainbowChange, onRainbowFlavorChange, onMaxResultsChange }: BerryProps) {
   const minVal = 0;
   const maxVal = 760;

   function starText(value: number) {
      if (value === 1) return `${value} Star`;
      else return `${value} Stars`;
   }

   return (
      <div className="settings">
         {/* Flavor & Star Settings */}
         <div className="left">
            <Stack direction="row" spacing={2} alignItems="center" padding="0.5">
               <label>
                  Star Range
               </label>
               <Slider
                  getAriaLabel={() => 'Star Range'}
                  value={starRange}
                  onChange={(e, v) => onStarRangeChange?.(v as [number, number])}
                  valueLabelDisplay="on"
                  valueLabelFormat={starText}
                  getAriaValueText={starText}
                  min={0}
                  max={5}
               />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" padding="0.5">
               <label>
                  Max Berries
               </label>
               <Slider
                  getAriaLabel={() => 'Max Number of Berries'}
                  value={maxBerries}
                  onChange={(e, v) => onMaxBerriesChange?.(Number(v))}
                  valueLabelDisplay="on"
                  min={3}
                  max={8}
               />
            </Stack>

            <FormControlLabel
               control={<Checkbox checked={enableRainbow} onChange={(e) => onRainbowChange?.(Boolean(e.target.checked))} />}
               label="Rainbow"
               labelPlacement="start"
            />

            <Stack direction="row" spacing={2} alignItems="center" padding="0.5">
               <FormControl fullWidth>
                  <InputLabel>Flavor A</InputLabel>
                  <Select
                     value={rainbowFlavors[0]}
                     label="Rainbow Flavor A"
                     onChange={(e) => onRainbowFlavorChange?.([e.target.value, rainbowFlavors[1]])}
                  >
                     {flavors.map((flavor) => (
                        <MenuItem key={flavor} value={flavor}>
                           {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                        </MenuItem>
                     ))}
                  </Select>
               </FormControl>
               <FormControl fullWidth>
                  <InputLabel>Flavor B</InputLabel>
                  <Select
                     value={rainbowFlavors[1]}
                     label="Rainbow Flavor B"
                     onChange={(e) => onRainbowFlavorChange?.([rainbowFlavors[0], e.target.value])}
                  >
                     {flavors.map((flavor) => (
                        <MenuItem key={flavor} value={flavor}>
                           {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                        </MenuItem>
                     ))}
                  </Select>
               </FormControl>
            </Stack>


            {flavors.map((flavor) => (
               <div key={flavor}>
                  <label>
                     {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                  </label>
                  <RangeSelector
                     onChange={(newVal) => onFlavorValuesChange?.(flavor, newVal)}
                     minVal={minVal}
                     maxVal={maxVal}
                  />
               </div>
            ))}
            <Stack direction="row" spacing={2} alignItems="center" padding="0.5" flexWrap="wrap">
               <label>
                  Max Results
               </label>
               <TextField
                  // label="Max Results"
                  type="number"
                  size="small"
                  value={maxResults}
                  onChange={(e) => onMaxResultsChange?.(parseInt(e.target.value, 10))}
               />
            </Stack>
         </div>
         {/* Berry Quantities */}
         <div className="right">

            {Object.keys(berryStats).map((berry) => (
               <Stack key={berry} direction="row" spacing={2} alignItems="center" padding={0.5}>
                  <label>
                     {berry}
                  </label>
                  <TextField
                     label="Min"
                     type="number"
                     size="small"
                     value={berryQuants[berry]}
                     onChange={(e) => onBerryQuantsChange?.(berry, Math.max(0, Number(e.target.value)))}
                     inputProps={{ style: { width: '5ch', textAlign: 'right' } }}
                  />
               </Stack>

            ))}
         </div>
      </div>
   )
}