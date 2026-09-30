import { Coffee, Utensils } from "lucide-react";
import { useState } from "react";
import type { DiningHallMenu } from "../types";
import { DetailPanel } from "./DetailPanel";

interface DiningDetailProps {
  menu: DiningHallMenu;
  currentMeal: string;
  onClose: () => void;
  onDirections: () => void;
}

export function DiningDetail({ menu, currentMeal, onClose, onDirections }: DiningDetailProps) {
  const [selectedMeal, setSelectedMeal] = useState(
    menu.meals.find((meal) => meal.meal === currentMeal)?.meal ?? menu.meals[0]?.meal,
  );
  const active = menu.meals.find((meal) => meal.meal === selectedMeal);
  const isRetail = menu.hall.category === "retail";
  return (
    <DetailPanel
      title={menu.hall.name}
      category={isRetail ? "Campus café" : "Dining hall"}
      icon={isRetail ? Coffee : Utensils}
      onClose={onClose}
      onDirections={onDirections}
    >
      {menu.meals.length > 1 && (
        <fieldset className="meal-tabs" aria-label="Choose meal">
          {menu.meals.map((meal) => (
            <button
              key={meal.meal}
              type="button"
              aria-pressed={selectedMeal === meal.meal}
              className={selectedMeal === meal.meal ? "is-active" : ""}
              onClick={() => setSelectedMeal(meal.meal)}
            >
              {meal.meal}
            </button>
          ))}
        </fieldset>
      )}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to scrollable content */}
      <div tabIndex={0} className="detail-content" key={selectedMeal}>
        <div className="menu-date">
          <span>Today’s menu</span>
          <time dateTime={menu.date}>
            {new Date(`${menu.date}T12:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>
        {active ? (
          Object.entries(active.stations).map(([station, items]) => (
            <section className="menu-station" key={station}>
              <h3>{station}</h3>
              <ul>
                {items.map((item, i) => (
                  <li key={`${i}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="empty-state">No menu is available today.</p>
        )}
      </div>
    </DetailPanel>
  );
}
