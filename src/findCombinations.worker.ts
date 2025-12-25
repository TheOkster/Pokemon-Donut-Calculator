import { findValidCombinations } from "./algs.tsx";

self.onmessage = (e) => {
  const {
   berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow
  } = e.data;

  const results = findValidCombinations(berryStats, flavorValues, rainbowFlavors, starRange, berryQuants, maxBerries, maxNumResults, enableRainbow);

  self.postMessage(results);
};