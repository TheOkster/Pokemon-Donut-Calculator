import { useEffect, useState } from 'react'
import './App.css'
import Papa from "papaparse"
import Settings, { type BerryDict, type BerryQuantDict } from './Settings'
import { Button } from '@mui/material';
export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];

function App() {


  const [maxBerries, setMaxBerries] = useState(8);
  const [maxNumResults, setMaxNumResults] = useState(25);
  const [berryStats, setBerryStats] = useState<BerryDict>({});
  const [berryQuants, setBerryQuants] = useState<BerryQuantDict>({});
  const [starRange, setStarRange] = useState<[number, number]>([0, 5]);
  const starCalorieCounts = [0, 120, 240, 350, 700, 960, Infinity];

  const [enableRainbow, setEnableRainbow] = useState(false);
  const [rainbowFlavors, setRainbowFlavors] = useState<[Flavor, Flavor]>(["sweet","sour"]);
  const [results, setResults] = useState<Combination[]>([]);
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

function meetsThresholds(stats: FlavorStats): Boolean {
  if(enableRainbow && (stats[rainbowFlavors[0]] != stats[rainbowFlavors[1]])) {
    return false;
  }
  for (const key in stats){
    if(key in flavorValues){
      if(stats[key] < flavorValues[key][0] || stats[key] > flavorValues[key][1]){
        return false;
      }

      if(enableRainbow && !(key in rainbowFlavors) && stats[key] >  stats[rainbowFlavors[0]]){
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
        // console.log(`${stats[key]} will never reach ${flavorValues[key][0]} with ${berriesLeft}`);
        return true;
      }

    } else if (key === "calories") {
      if(stats[key] < (starCalorieCounts[starRange[0]] - 400 * berriesLeft) || stats[key] > starCalorieCounts[starRange[1]+1]){
        // console.log(`${stats[key]} don't have enough calories`);
        return true;
      }
    } else{
      // console.log(`${key} is not in flavorValues`)
    }
  }
  return false;
}

type Result = {
  combo: Combination;
  calories: number;
};
function findValidCombinations(): Combination[] {
  const results: Result[] = [];
  const baseStats: FlavorStats = Object.fromEntries(flavors.map((flavor) =>[flavor, 0]));
  baseStats["calories"] = 0;
  function berryUtility(berry: string): number {
      const stats = berryStats[berry];
      let score = 0;

      for (const flavor of flavors) {
        const [min, max] = flavorValues[flavor];
        if (stats[flavor] > 0) {
          score += stats[flavor] / Math.max(1, min);
        }
      }

      score += stats.calories / Math.max(1, starCalorieCounts[starRange[0]]);
      return score;
  }
function tryInsert(combo: Combination, calories: number): boolean {
  if (
    results.length === maxNumResults &&
    calories > results[0].calories
  ) {
    return false;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];

    const rSubC = isSubset(r.combo, combo);
    const cSubR = isSubset(combo, r.combo);

    if (rSubC && !cSubR) return false;

    if (cSubR && !rSubC) {
      results.splice(i, 1);
      i--;
    }

    if (rSubC && cSubR) return false;
  }

  results.push({ combo, calories });
  results.sort((a, b) => b.calories - a.calories);

  if (results.length > maxNumResults) {
    results.length = maxNumResults;
  }

  return true;
}

const sortedBerries = Object.keys(berryQuants)
  .filter(b => berryQuants[b] > 0)
  .sort((a, b) => berryUtility(b) - berryUtility(a));
  function backtrack(
    i: number,
    currentStats: FlavorStats,
    currentCombo: Combination,
    berriesSelected: number,
  ) {
    // console.log(currentCombo);
    if (
    results.length === maxNumResults &&
    currentStats.calories > results[0].calories) {
      return;
    }

    for (const r of results) {
      if (isSubset(r.combo, currentCombo)) {
          // console.log(`${currentCombo} is superseded`);
        return;
      }
    }
    if (berriesSelected > 2 && meetsThresholds(currentStats)) {
      tryInsert({ ...currentCombo }, currentStats.calories);
      // console.log(`${JSON.stringify(currentCombo)} meets thresholds`);
      return;
    } else if (berriesSelected > 0 && willNeverMeetThresholds(currentStats, flavorValues, starRange, maxBerries - berriesSelected)){
      // console.log(`${JSON.stringify(currentCombo)} will never meet thresholds`);
      return;   
    } else {
      // console.log(`${JSON.stringify(currentCombo)} does not meet thresholds, i = ${i}`);
    }

    if (i >= sortedBerries.length || berriesSelected >= maxBerries) return;

    const berry = sortedBerries[i];
    // const maxCanPick = Math.min(berryQuants[berry], maxBerries-berriesSelected);
    let helps = false;
    for (const flavor of flavors) {
      if (
        enableRainbow || berriesSelected < 3 || currentStats[flavor] < flavorValues[flavor][0] &&
        berryStats[berry][flavor] > 0 || currentStats["calories"] < starCalorieCounts[starRange[0]]
      ) {
        helps = true;
        break;
      }
    }

  if (helps && berriesSelected < maxBerries && (currentCombo[berry] ?? 0) < berryQuants[berry]) {
 backtrack(
        i,
        addStats(currentStats, berryStats[berry], 1),
        { ...currentCombo, [berry]: (currentCombo[berry] ?? 0) + 1 },
        berriesSelected + 1
      );  }
    backtrack(i + 1, currentStats, currentCombo, berriesSelected);
    // console.log(currentCombo[berry]);

  }

  backtrack(0, baseStats, {}, 0);
  return results.map((result) => result.combo);
}
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
      <Button variant="contained" onClick={() => setResults(findValidCombinations())}>Calculate</Button>
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
