import type { Combination } from "./utils";

interface RecipeProps {
   results: Combination[];
}

export default function Recipes({results}: RecipeProps){
      return (<>
      {results.map((combo, index) => (
          <div key={index}>
            {Object.entries(combo)
              .map(([name, quantity]) => `${quantity}x ${name}`)
              .join(', ')}
          </div>
        ))}
      </>);
}