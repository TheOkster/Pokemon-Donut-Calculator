import { useEffect, useState } from 'react'
import './App.css'
import Papa from "papaparse"
import Settings, { type BerryDict, type BerryQuantDict } from './Settings'
import { Button } from '@mui/material';
function App() {

  const [maxBerries, setMaxBerries] = useState(8);
  const [berryStats, setBerryStats] = useState<BerryDict>({});
  const [berryQuants, setBerryQuants] = useState<BerryQuantDict>({});
  const [starRange, setStarRange] = useState<[number, number]>([1, 5]);
  const starCalorieCounts = [0, 120, 240, 350, 700, 960, Infinity];
  const [results, setResults] = useState<Combination[]>([]);
    const flavors = ["sweet", "spicy", "fresh", "bitter", "sour"] as const;

    const minVal = 0;
    const maxVal = 760;
    const [flavorValues, setFlavorValues] = useState<{
      [key: string]: [number, number];
    }>(Object.fromEntries(
    flavors.map((taste) => [taste, [minVal, maxVal]])
  ));

  const handleBerryQuantsChange = (berry: string, newValue: number) => {
    setBerryQuants((prev) => ({ ...prev, [berry]: newValue }));
  };
  const handleFlavorChange = (flavor: string, newValue: [number, number]) => {
    setFlavorValues((prev) => ({ ...prev, [flavor]: newValue }));
  };

  useEffect(() => {
    fetch("/berries.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        const [headerRow, ...rows] = parsed.data;
        const headers = headerRow.slice(1).map((header) => header.toLowerCase() );
        const result: BerryDict = {};
        const quantsTemp: BerryQuantDict = {};

        rows.forEach((row) => {
          const key = row[0];
          const values: Record<string, number> = {};
          headers.forEach((header, index) => {
            values[header] = Number(row[index + 1]);
          });
          result[key] = values;
          quantsTemp[key] = 0;
        });

        setBerryStats(result);
        setBerryQuants(quantsTemp);
      });  }, []);



type Combination = Readonly<{
  [berry: string]: number;
}>;
type FlavorStats = {
  [flavor: string]: number;
}
function addStats(base: FlavorStats, add: FlavorStats, multiplier: number){
  const newStats: FlavorStats = {};
  for(const key in base){
    newStats[key] = base[key];
  }
  for(const key in add){
    newStats[key] += add[key] * multiplier;
  }
  return newStats
}

function isSubset(a: Combination, b: Combination): boolean {
  for (const berry in a) {
    if ((b[berry] ?? 0) < a[berry]) return false;
  }
  return true;
}

function meetsThresholds(stats: FlavorStats, flavorValues: {[flavor: string]: [number, number]}, starRange: [number, number]): Boolean {
  for (const key in stats){
    if(key in flavorValues){
      if(stats[key] < flavorValues[key][0] || stats[key] > flavorValues[key][1]){
        return false;
      }

    } else if (key === "calories") {
      if(stats[key] < starCalorieCounts[starRange[0]] || stats[key] > starCalorieCounts[starRange[1]+1]){
        return false;
      }
    } else{
      console.log(`${key} is not in flavorValues`)
    }
  }
  return true;
}

function willNeverMeetThresholds(stats: FlavorStats, flavorValues: {[flavor: string]: [number, number]}, starRange: [number, number], berriesLeft: number): Boolean {
  for (const key in stats){
    if(key in flavorValues){
      if(stats[key] < (flavorValues[key][0] - 95 * berriesLeft) || stats[key] > flavorValues[key][1]){
        console.log(`${stats[key]} will never reach ${flavorValues[key][0]} with ${berriesLeft}`);
        return true;
      }

    } else if (key === "calories") {
      if(stats[key] < (starCalorieCounts[starRange[0]] - 400 * berriesLeft) || stats[key] > starCalorieCounts[starRange[1]+1]){
        console.log(`${stats[key]} don't have enough calories`);
        return true;
      }
    } else{
      console.log(`${key} is not in flavorValues`)
    }
  }
  return false;
}


function findValidCombinations(): Combination[] {
  const results: Combination[] = [];
  const baseStats: FlavorStats = Object.fromEntries(flavors.map((flavor) =>[flavor, 0]));
  baseStats["calories"] = 0;
  const sortedBerries = Object.keys(berryQuants).sort();
  function backtrack(
    i: number,
    currentStats: FlavorStats,
    currentCombo: Combination,
    berriesSelected: number,
  ) {
    console.log(currentCombo);
    if (berriesSelected > 0 && meetsThresholds(currentStats, flavorValues, starRange)) {
      for (const r of results) {
        if (isSubset(r, currentCombo)) {
          console.log(`${currentCombo} is superseded`);
          return;
        }
      }

      // console.log(`${currentCombo} meets thresholds, i = ${i}`);
      results.push({ ...currentCombo });
      return;
    } else if (berriesSelected > 0 && willNeverMeetThresholds(currentStats, flavorValues, starRange, maxBerries - berriesSelected)){
      // console.log(`${currentCombo} will never meet thresholds`);
      return;   
    } else {
      // console.log(`${currentCombo} does not meet thresholds, i = ${i}`);
    }

    if (i >= sortedBerries.length || berriesSelected >= maxBerries) return;

    const berry = sortedBerries[i];
    // const maxCanPick = Math.min(berryQuants[berry], maxBerries-berriesSelected);
    if (berriesSelected < maxBerries && (currentCombo[berry] ?? 0) < berryQuants[berry]) {
      // console.log("here in theory");
      backtrack(
        i,
        addStats(currentStats, berryStats[berry], 1),
        { ...currentCombo, [berry]: (currentCombo[berry] ?? 0) + 1 },
        berriesSelected + 1
      );
    }
    backtrack(i + 1, currentStats, currentCombo, berriesSelected);
    // console.log(currentCombo[berry]);

  }

  backtrack(0, baseStats, {}, 0);
  return results;
}
  return (
    <>

      <Settings
      starRange={starRange}
      flavorValues={flavorValues}
      maxBerries={maxBerries}
      berryQuants={berryQuants}
      berryStats={berryStats}
      onStarRangeChange={setStarRange}
      onFlavorValuesChange={handleFlavorChange}
      onBerryQuantsChange={handleBerryQuantsChange}
      onMaxBerriesChange={setMaxBerries}/>   
      <Button variant="contained" onClick={() => setResults(findValidCombinations())}>Calculate</Button>
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
