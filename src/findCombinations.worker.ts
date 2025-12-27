import { findValidCombinations } from "./algs.tsx";

self.onmessage = (e) => {
   const {
      berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow
   } = e.data;
   const scorer = (berry: string) => berryStats[berry]["bitter"] + berryStats[berry]["spicy"] + 0.5 * berryStats[berry]["fresh"] + 1 / 3 * (berryStats[berry]["sweet"] + berryStats[berry]["sour"]); //TODO: Move back to app.tsx
   const results = findValidCombinations(berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow, scorer);
   self.postMessage(results);
};