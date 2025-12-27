export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];
export type Combination = Readonly<{
  [berry: string]: number;
}>;
export type FlavorStats = {
  [flavor: string]: number;
}


/**
 * Calculates the number of stars based on calorie count.
 * @param calories The total calorie count.
 * @returns The number of stars (0-5).
 */
export function calcStars(calories: number) {
   if (calories < 120) return 0;
   if (calories < 240) return 1;
   if (calories < 350) return 2;
   if (calories < 700) return 3;
   if (calories < 960) return 4;
   return 5;
}
