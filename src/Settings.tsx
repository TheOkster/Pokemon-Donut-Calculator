import { useEffect, useState } from 'react'
import { Slider, Stack, TextField } from '@mui/material'
import RangeSelector from './RangeSelector'
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
   onStarRangeChange?: (starRange: [number, number]) => void;
   onFlavorValuesChange?: (flavor: string, newValue: [number, number]) => void;
   onBerryQuantsChange?: (berry: string, newQuant: number) => void;
   onMaxBerriesChange?: (maxBerries: number) => void;
  }
export default function Settings({starRange, maxBerries, berryQuants, berryStats, onStarRangeChange, onFlavorValuesChange, onBerryQuantsChange, onMaxBerriesChange}: BerryProps){
//   const [starValue, setStarValue] = useState<[number, number]>([1, 5])
  const minVal = 0;
  const maxVal = 760;
    const flavors = ["sweet", "spicy", "fresh", "bitter", "sour"] as const;

  
  const [flavorValues, setFlavorValues] = useState<{
    [key: string]: [number, number];
  }>(Object.fromEntries(
  flavors.map((taste) => [taste, [minVal, maxVal]])
));

  function starText(value: number) { 
    if(value === 1) return `${value} Star`; 
    else return `${value} Stars`; 
  } 

//   const [maxBerryNum, setMaxBerryNum] = useState(8);

//   const [berries, setBerries] = useState<BerryDict>({});
//   const [berryQuants, setBerryQuants] = useState<BerryQuantDict>({});
  // const [berryTextFieldQuants, setBerryTextFieldQuants] = useState<BerryQuantDict>({});

  const handleFlavorChange = (taste: keyof typeof flavorValues, newValue: [number, number]) => {
    setFlavorValues((prev) => ({ ...prev, [taste]: newValue }));
  };
//   const handleBerryQuantsChange = (berry: string, newValue: number) => {
//     setBerryQuants((prev) => ({ ...prev, [berry]: newValue }));
//   };

//   useEffect(() => {
//     fetch("/berries.csv")
//       .then((res) => res.text())
//       .then((csvText) => {
//         const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
//         const [headerRow, ...rows] = parsed.data;
//         const headers = headerRow.slice(1).map((header) => header.toLowerCase() );
//         const result: BerryDict = {};
//         const quantsTemp: BerryQuantDict = {};

//         rows.forEach((row) => {
//           const key = row[0];
//           const values: Record<string, number> = {};
//           headers.forEach((header, index) => {
//             values[header] = Number(row[index + 1]);
//           });
//           result[key] = values;
//           quantsTemp[key] = 0;
//         });

//         setBerries(result);
//         setBerryQuants(quantsTemp);
//       });
//   }, []);

  return (
    <>
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
      <Slider
        getAriaLabel={() => 'Max Number of Berries'}
        value={maxBerries}
        onChange={(e, v) => onMaxBerriesChange?.(Number(v))}
        valueLabelDisplay="on"
        min={1}
        max={8}
      />
      {flavors.map((flavor) => (
              <div key={flavor}>
                <label>
                  {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                </label>
                <RangeSelector
                  value={flavorValues[flavor]}
                  onChange={(newVal) => onFlavorValuesChange?.(flavor, newVal)}
                  minVal={minVal}
                  maxVal={maxVal}
                />
              </div>
            ))}    
            {Object.keys(berryStats).map((berry) => (
              <Stack direction="row" spacing={2} alignItems="center" padding={0.5}>
                <label>
                    {berry}
                  </label>
                <TextField
                  label="Min"
                  type="number"
                  size="small"
                  value={berryQuants[berry]}
                  onChange={(e) => onBerryQuantsChange?.(berry, Math.max(0, Number(e.target.value)))}
                />
              </Stack>
            ))}    
      </>
  )
}