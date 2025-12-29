import type { BerryDict, BerryQuantDict } from "./Settings";
import { calcStarsStats, flavors, type Combination, type Flavor, type FlavorStats } from "./utils";
const MAX_BERRY_FLAVOR = 95;

/**
 * Adds two FlavorStats together
 * @param base the original element
 * @param add the elemnt to add
 * @returns a new FlavorStats with all the values of the flavors of each individual added together
 */
function addStats(base: FlavorStats, add: FlavorStats) {
   const newStats: FlavorStats = {};
   for (const key in base) {
      newStats[key] = base[key];
   }
   for (const key in add) {
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
/**
 * Says whether a pair of stats meets the thresholds
 * @param stats a FlavorStats instance
 * @param enableRainbow checks whether rainbow is enabled
 * @param flavorValues an object with flavor strings and a range of valid numbers as a value (inclusive)
 * @param rainbowFlavors the dominant flavors if applicable
 * @param starRange the range of valid stars (inclusive)
 * @returns true iff the stats meets the thresholds
 */
function meetsThresholds(stats: FlavorStats, enableRainbow: boolean, flavorValues: { [flavor: string]: [number, number] }, rainbowFlavors: [Flavor, Flavor], starRange: [number, number]): boolean {
   if (enableRainbow && (stats[rainbowFlavors[0]] != stats[rainbowFlavors[1]])) {
      return false;
   }
   for (const key in stats) {
      if (key in flavorValues) {
         if (stats[key] < flavorValues[key][0] || stats[key] > flavorValues[key][1]) {
            return false;
         }

         if (enableRainbow && !(key in rainbowFlavors) && stats[key] > stats[rainbowFlavors[0]]) {
            return false;
         }

      } else {
         console.log(`${key} is not in flavorValues`)
      }
   }
   if (calcStarsStats(stats) < starRange[0] || calcStarsStats(stats) > starRange[1]) {
      return false;
   }
   return true;
}
/**
 * Returns true if it is determined that it is impossible to meet thresholds even with future berries
 * This is not comprehensive, so returns false more than it should.
 * @param stats a FlavorStats instance
 * @param flavorValues an object with flavor strings and a range of valid numbers as a value (inclusive)
 * @param starRange the range of valid stars (inclusive)
 * @param berriesLeft the number of berries that can still be added
 * @returns true if it is determined stats can never reach threshols
 */
function willNeverMeetThresholds(stats: FlavorStats, flavorValues: { [flavor: string]: [number, number] }, starRange: [number, number], berriesLeft: number): boolean {
   for (const key in stats) {
      if (key in flavorValues) {
         if (stats[key] < (flavorValues[key][0] - MAX_BERRY_FLAVOR * berriesLeft) || stats[key] > flavorValues[key][1]) {
            return true;
         }
      }
   }
   if (calcStarsStats(stats) > starRange[1]) {
      return true;
   }
   return false;
}

type Result = {
   combo: Combination;
   score: number;
};
/**
 * Finds valid combinations of berries given constraints, returns the top maxNuMresults combinations according to the scorer function
 * @param berryStats list of berries to their flavor stats
 * @param flavorValues an object with flavor strings and a range of valid numbers as a value (inclusive)
 * @param rainbowFlavors two dominant flavors if applicable
 * @param starRange the range of valid stars (inclusive)
 * @param berryQuants the number of each berry available 
 * @param maxBerries the max berries that can be used in the recipes
 * @param maxNumResults the maximum number of results to return
 * @param enableRainbow whether rainbow donuts are enabled
 * @param scorer the function that should return a score for a given combination
 * @returns 
 */
export function findValidCombinations(berryStats: BerryDict, flavorValues: { [key: string]: [number, number] }, rainbowFlavors: [Flavor, Flavor], starRange: [number, number], berryQuants: BerryQuantDict, maxBerries: number, maxNumResults: number, enableRainbow: boolean, scorer: (berry: string) => number): Combination[] {
   const results: Result[] = [];
   const baseStats: FlavorStats = Object.fromEntries(flavors.map((flavor) => [flavor, 0]));
   baseStats["calories"] = 0;
   /* Calculates a utility score for a berry based on how well it meets the flavor requirements */
   function berryUtility(berry: string): number {
      const stats = berryStats[berry];
      let score = 0;

      for (const flavor of flavors) {
         const [min, _] = flavorValues[flavor];
         if (stats[flavor] > 0) {
            score += stats[flavor] / Math.max(1, min);
         }
      }

      return score;
   }
   /* Tries to insert a combination into the results list, maintaining only non-subset combinations */
   function tryInsert(combo: Combination, score: number): boolean {
      if (
         results.length === maxNumResults &&
         score > results[0].score
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

      results.push({ combo, score: score });
      results.sort((a, b) => b.score - a.score);

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
      currentScore: number,
      berriesSelected: number,
   ) {
      // console.log(currentCombo);
      if (
         results.length === maxNumResults &&
         currentStats.calories > results[0].score) {
         return;
      }
      // Prunes if subset of current solution
      for (const r of results) {
         if (isSubset(r.combo, currentCombo)) {
            return;
         }
      }
      // Checks if result can be pruned  (whether it meets thresholds or not)
      if (berriesSelected > 2 && meetsThresholds(currentStats, enableRainbow, flavorValues, rainbowFlavors, starRange)) {
         tryInsert({ ...currentCombo }, currentScore);
         return;
      } else if (berriesSelected > 0 && willNeverMeetThresholds(currentStats, flavorValues, starRange, maxBerries - berriesSelected)) {
         return;
      }

      if (i >= sortedBerries.length || berriesSelected >= maxBerries) return;

      const berry = sortedBerries[i];

      // only adds berries that help meet thresholds
      let helps = false;
      for (const flavor of flavors) {
         if (
            enableRainbow || calcStarsStats(currentStats) < starRange[0] || berriesSelected < 3 || currentStats[flavor] < flavorValues[flavor][0] &&
            berryStats[berry][flavor] > 0
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
            currentScore + scorer(berry),
            berriesSelected + 1
         );
      }
      backtrack(i + 1, currentStats, currentCombo, currentScore, berriesSelected);

   }

   backtrack(0, baseStats, {}, 0, 0);
   return results.map(result => result.combo);
}