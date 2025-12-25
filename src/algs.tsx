import type { BerryDict, BerryQuantDict } from "./Settings";
import { flavors, type Combination, type Flavor, type FlavorStats } from "./utils";

  const starCalorieCounts = [0, 120, 240, 350, 700, 960, Infinity];

/**
 * Adds two FlavorStats together
 * @param base the original element
 * @param add the elemnt to add
 * @returns a new FlavorStats with all the values of the flavors of each individual added together
 */
function addStats(base: FlavorStats, add: FlavorStats){
  const newStats: FlavorStats = {};
  for(const key in base){
    newStats[key] = base[key];
  }
  for(const key in add){
    newStats[key] += add[key];
  }
  return newStats
}
/**
 * Checks whether a Combination is a subset of another
 * @param a first Combination
 * @param b second Combination
 * @returns true if a contains all the elements b has
 */
function isSubset(a: Combination, b: Combination): boolean {
  for (const berry in a) {
    if ((b[berry] ?? 0) < a[berry]) return false;
  }
  return true;
}

function meetsThresholds(stats: FlavorStats, enableRainbow: boolean, flavorValues: {[flavor: string]: [number, number]},  rainbowFlavors: [Flavor, Flavor], starRange: [number, number]): Boolean {
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
export function findValidCombinations(berryStats: BerryDict, flavorValues: {[key: string]: [number, number]}, rainbowFlavors: [Flavor, Flavor], starRange: [number, number],  berryQuants: BerryQuantDict, maxBerries: number, maxNumResults: number, enableRainbow: boolean): Combination[] {
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
    if (berriesSelected > 2 && meetsThresholds(currentStats, enableRainbow, flavorValues, rainbowFlavors, starRange)) {
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
        addStats(currentStats, berryStats[berry]),
        { ...currentCombo, [berry]: (currentCombo[berry] ?? 0) + 1 },
        berriesSelected + 1
      );  }
    backtrack(i + 1, currentStats, currentCombo, berriesSelected);
    // console.log(currentCombo[berry]);

  }

  backtrack(0, baseStats, {}, 0);
  return results.map((result) => result.combo);
}