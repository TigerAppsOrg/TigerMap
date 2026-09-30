import type { POI } from "../types";
import { getCategoryIcon } from "../utils/categories";

export function PlaceCarousel({ places, onPick }: { places: POI[]; onPick: (poi: POI) => void }) {
  return (
    <div className="popular-places">
      {places.map((poi) => {
        const Icon = getCategoryIcon(poi.cat);
        return (
          <button key={poi.id} type="button" className="place-row" onClick={() => onPick(poi)}>
            <span className="place-icon">
              <Icon size={19} />
            </span>
            <span className="place-row-copy">
              <strong>{poi.name}</strong>
            </span>
          </button>
        );
      })}
    </div>
  );
}
