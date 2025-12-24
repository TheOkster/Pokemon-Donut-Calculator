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
    const newBerryQuants = { ...berryQuants, [berry]: newValue };
    setBerryQuants(newBerryQuants);
    localStorage.setItem("berryQuants", JSON.stringify(newBerryQuants));
    // console.log(newBerryQuants);
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
      // console.log(data);
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
      // console.log(`${key} is not in flavorValues`)
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


function findValidCombinations(): Combination[] {
  const results: Combination[] = [];
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
function insertMinimal(results: Combination[], combo: Combination): boolean {
  for (let i = 0; i < results.length; i++) {
    const r = results[i];

    const rSubC = isSubset(r, combo);
    const cSubR = isSubset(combo, r);

    if (rSubC && !cSubR) {
      // existing is strictly better
      return false;
    }

    if (cSubR && !rSubC) {
      // new combo dominates old
      results.splice(i, 1);
      i--;
    }

    if (rSubC && cSubR) {
      // equal
      return false;
    }
  }

  results.push(combo);
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
    // for (const r of results) {
    //   if (isSubset(r, currentCombo)) {
    //       // console.log(`${currentCombo} is superseded`);
    //     return;
    //   }
    // }
    if (berriesSelected > 0 && meetsThresholds(currentStats, flavorValues, starRange)) {
      insertMinimal(results, { ...currentCombo });
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
    let helps = false;
    for (const flavor of flavors) {
      if (
        currentStats[flavor] < flavorValues[flavor][0] &&
        berryStats[berry][flavor] > 0 || currentStats["calories"] < starCalorieCounts[starRange[0]] || berriesSelected === 0
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
    // if (berriesSelected < maxBerries && (currentCombo[berry] ?? 0) < berryQuants[berry]) {
    //   // console.log("here in theory");
    //   backtrack(
    //     i,
    //     addStats(currentStats, berryStats[berry], 1),
    //     { ...currentCombo, [berry]: (currentCombo[berry] ?? 0) + 1 },
    //     berriesSelected + 1
    //   );
    // }
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
