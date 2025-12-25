import { findValidCombinations } from "./algs.tsx";

self.onmessage = (e) => {
  const {
   berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow
  } = e.data;
  const scorer = (berry: string) => berryStats[berry]["bitter"] + berryStats[berry]["spicy"] + 0.5 * berryStats[berry]["fresh"] + 1 / 3 * (berryStats[berry]["sweet"] + berryStats[berry]["sour"]);

  const results = findValidCombinations(berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow, scorer);
//   results.sort((a, b) => {
//           const aCalories = Object.entries(a).reduce((acc, [key, val]) => acc + scorer(key) * val, 0);
//           const bCalories = Object.entries(b).reduce((acc, [key, val]) => acc + scorer(key) * val, 0);
//           return bCalories - aCalories;
//       })
  self.postMessage(results);
};