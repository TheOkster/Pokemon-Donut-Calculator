import { useEffect, useRef, useState } from 'react'
import './App.css'
import Papa from "papaparse"
import Settings, { type BerryDict, type BerryQuantDict } from './Settings'
import { Button } from '@mui/material';
import { findValidCombinations } from './algs';
import type { Combination } from './utils';
export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];

function App() {


  const [maxBerries, setMaxBerries] = useState(8);
  const [maxNumResults, setMaxNumResults] = useState(25);
  const [berryStats, setBerryStats] = useState<BerryDict>({});
  const [berryQuants, setBerryQuants] = useState<BerryQuantDict>({});
  const [starRange, setStarRange] = useState<[number, number]>([0, 5]);
  const [enableRainbow, setEnableRainbow] = useState(false);
  const [rainbowFlavors, setRainbowFlavors] = useState<[Flavor, Flavor]>(["sweet","sour"]);
  const [results, setResults] = useState<Combination[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
    const minVal = 0;
    const maxVal = 760;
    const [flavorValues, setFlavorValues] = useState<{
      [key: string]: [number, number];
    }>(Object.fromEntries(
    flavors.map((taste) => [taste, [minVal, maxVal]])
  ));

  const handleBerryQuantsChange = (berry: string, newValue: number) => {
    const newBerryQuants = { ...berryQuants, [berry]: newValue };
    setBerryQuants(newBerryQuants);
    localStorage.setItem("berryQuants", JSON.stringify(newBerryQuants));
  };
  const handleFlavorChange = (flavor: string, newValue: [number, number]) => {
    setFlavorValues((prev) => ({ ...prev, [flavor]: newValue }));
  };

  useEffect(() => {
      const data = localStorage.getItem("berryQuants");
      const quantsTemp: BerryQuantDict = data ? JSON.parse(data) as Record<string, number> : {};
      if (data) {
        setBerryQuants(JSON.parse(data) as Record<string, number>);
      }
    fetch("/berries.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        const [headerRow, ...rows] = parsed.data;
        const headers = headerRow.slice(1).map((header) => header.toLowerCase() );
        const result: BerryDict = {};
        // const quantsTemp: BerryQuantDict = data;

        rows.forEach((row) => {
          const key = row[0];
          const values: Record<string, number> = {};
          headers.forEach((header, index) => {
            values[header] = Number(row[index + 1]);
          });
          result[key] = values;
          if(!(key in quantsTemp)){
            quantsTemp[key] = 0;
          }
        });

        setBerryStats(result);
        setBerryQuants(quantsTemp);
      });  
    }, []);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./findCombinations.worker.ts", import.meta.url),
        { type: "module" }

    );

    workerRef.current.onmessage = (e) => {
      setResults(e.data);
      setIsCalculating(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);
    const handleCalculate = () => {
      setIsCalculating(true);

      workerRef.current?.postMessage({
berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow
      });
    };

  return (
    <>

      <Settings
      enableRainbow={enableRainbow}
      rainbowFlavors={rainbowFlavors}
      starRange={starRange}
      flavorValues={flavorValues}
      maxBerries={maxBerries}
      berryQuants={berryQuants}
      berryStats={berryStats}
      maxResults={maxNumResults}
      onStarRangeChange={setStarRange}
      onFlavorValuesChange={handleFlavorChange}
      onBerryQuantsChange={handleBerryQuantsChange}
      onMaxResultsChange={setMaxNumResults}
      onMaxBerriesChange={setMaxBerries}
      onRainbowChange={setEnableRainbow}
      onRainbowFlavorChange={setRainbowFlavors}/>   
      <Button variant="contained" disabled={isCalculating} onClick={handleCalculate}>Calculate</Button>
      {/* // .sort((a, b) => {
      //     const aCalories = Object.entries(a).reduce((acc, [key, val]) => acc + berryStats[key]["calories"] * val, 0);
      //     const bCalories = Object.entries(b).reduce((acc, [key, val]) => acc + berryStats[key]["calories"] * val, 0);
      //     return aCalories - bCalories;
      // }))} */}
      {results.length}
      {results.map((combo, index) => (
          <div key={index}>
            {Object.entries(combo)
              .map(([name, quantity]) => `${quantity}x ${name}`)
              .join(', ')}
          </div>
        ))}
    </>

  )
}


export default App