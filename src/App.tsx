import { useEffect, useRef, useState } from 'react'
import './App.css'
import Papa from "papaparse"
import Settings, { type BerryDict, type BerryQuantDict } from './Settings'
import type { Combination } from './utils';
export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];
import { RecipeCard } from "./RecipeCard.tsx"
function App() {
  const [maxBerries, setMaxBerries] = useState(8);
  const [maxNumResults, setMaxNumResults] = useState(25);
  const [berryStats, setBerryStats] = useState<BerryDict>({});
  const [berryQuants, setBerryQuants] = useState<BerryQuantDict>({});
  const [starRange, setStarRange] = useState<[number, number]>([0, 5]);
  const [enableRainbow, setEnableRainbow] = useState(false);
  const [rainbowFlavors, setRainbowFlavors] = useState<[Flavor, Flavor]>(["sweet", "sour"]);
  const [results, setResults] = useState<Combination[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [flavorValues, setFlavorValues] = useState<{
    [key: string]: [number, number];
  }>(Object.fromEntries(
    flavors.map((taste) => [taste, [0, 760]])));
  const handleBerryQuantsChange = (berry: string, newValue: number) => {
    const newBerryQuants = { ...berryQuants, [berry]: newValue };
    setBerryQuants(newBerryQuants);
    localStorage.setItem("berryQuants", JSON.stringify(newBerryQuants));
  };
  const handleFlavorChange = (flavor: string, newValue: [number, number]) => {
    setFlavorValues((prev) => ({ ...prev, [flavor]: newValue }));
  };

  useEffect(() => {
    fetch("/berries.csv")
      .then((res) => res.text())
      .then((csvText) => {
        // loading CSV
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        const [headerRow, ...rows] = parsed.data;
        const headers = headerRow.slice(1).map((header) => header.toLowerCase());
        const result: BerryDict = {};
        const quantsTemp: BerryQuantDict = {};

        rows.forEach((row) => {
          const key = row[0];
          const values: Record<string, number> = {};
          headers.forEach((header, index) => {
            values[header] = Number(row[index + 1]);
          });
          result[key] = values;
          if (!(key in quantsTemp)) {
            quantsTemp[key] = 0;
          }
        });
        // Loads from local storage and replaces default quantities
        const data = localStorage.getItem("berryQuants");
        const storedQuants: BerryQuantDict = data ? JSON.parse(data) as Record<string, number> : {};
        for (const key in storedQuants) {
          if (key in quantsTemp) {
            quantsTemp[key] = storedQuants[key];
          }
        }
        setBerryStats(result);
        setBerryQuants(quantsTemp);
      });
  }, []);

  // Worker for Calculations
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
      <div className="container">
        <div className="left">
          <Settings
            enableRainbow={enableRainbow}
            rainbowFlavors={rainbowFlavors}
            starRange={starRange}
            flavorValues={flavorValues}
            maxBerries={maxBerries}
            berryQuants={berryQuants}
            berryStats={berryStats}
            maxResults={maxNumResults}
            isCalculating={isCalculating}
            onStarRangeChange={setStarRange}
            onFlavorValuesChange={handleFlavorChange}
            onBerryQuantsChange={handleBerryQuantsChange}
            onMaxResultsChange={setMaxNumResults}
            onMaxBerriesChange={setMaxBerries}
            onRainbowChange={setEnableRainbow}
            onRainbowFlavorChange={setRainbowFlavors}
            onCalculate={handleCalculate} />

        </div>
        <div className="right">
          {!isCalculating && (
            <div style={{ textAlign: 'center', fontWeight: 500, marginBottom: '1rem' }}>
              {results.length} results calculated
            </div>
          )}
          {results.map((combo) => (
            <RecipeCard combo={combo} berryStats={berryStats} />
          ))}
        </div>
      </div>


    </>

  )
}


export default App