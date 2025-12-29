export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];
export type Combination = Readonly<{
  [berry: string]: number;
}>;
export type FlavorStats = {
  [flavor: string]: number;
}



/**
 * Calculates the number of stars based on flavor stats.
 * @param flavorScore The total flavor stats.
 * @returns The number of stars (0-5).
 */
export function calcStarsStats(flavorScore: FlavorStats) {
  let flavorSum = 0;
  for (const key in flavorScore) {
    if(flavors.includes(key as Flavor)){
      flavorSum += flavorScore[key];
    }
  }
   if (flavorSum < 120) return 0;
   if (flavorSum < 240) return 1;
   if (flavorSum < 350) return 2;
   if (flavorSum < 700) return 3;
   if (flavorSum < 960) return 4;
   return 5;
}
