import type { BerryDict } from "./Settings";
import type { Combination, FlavorStats } from "./utils";
import { calcStars, calcStarsStats, flavors } from "./utils";
import "./RecipeCard.css";
const STAR_CALORIES_MULT = [1, 1.1, 1.2, 1.3, 1.4, 1.5];

export function RecipeCard({ combo, berryStats }: { combo: Combination, berryStats: BerryDict }) {
   function calculateSums(combo: Combination): FlavorStats {
      const sums: FlavorStats = {
         sweet: 0,
         spicy: 0,
         sour: 0,
         bitter: 0,
         fresh: 0,
         calories: 0
      };
      Object.entries(combo).forEach(([berry, quantity]) => {
         for (const flavor of flavors) {
            sums[flavor] += berryStats[berry][flavor] * quantity;
         }
         sums["calories"] += berryStats[berry]["calories"] * quantity;
      });
      sums["calories"] = Math.floor(sums["calories"] * STAR_CALORIES_MULT[calcStarsStats(sums)]);
      return sums;
   }
   const stats = calculateSums(combo);
   return (
      <div className="card">
         <div className="header">
            <div className="meta">
               <div className="stars">{calcStars(stats.calories)}<span className="star-symbol" aria-hidden>★</span></div>
               <div className="calories"><span className="cal-number">{stats.calories}</span><span className="cal-suffix">cal</span></div>
            </div>
            <span className="items">
               {Object.entries(combo)
                  .map(([name, quantity]) => `${quantity} ${name}`)
                  .join(', ')}
            </span>
         </div>

         <div style={{ flex: 1 }} />

         <div className="stats-row">
            {Object.entries(stats).filter(([key]) => key !== "calories").map(([flavor, val]) => (
               <div className={`stat ${flavor}`} key={flavor}>
                  <span className="label">{flavor}</span>
                  <span className="value">{val}</span>
               </div>
            ))}


         </div>
      </div>
   );
}
