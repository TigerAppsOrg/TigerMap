import { Accessibility, ArrowUpRight, Clock, ExternalLink, MapPin, Phone } from "lucide-react";
import type { POI } from "../types";
import { getCategoryIcon } from "../utils/categories";
import { DetailPanel } from "./DetailPanel";

interface POIDetailProps {
  poi: POI;
  onClose: () => void;
  onDirections: () => void;
}

export function POIDetail({ poi, onClose, onDirections }: POIDetailProps) {
  return (
    <DetailPanel
      title={poi.name}
      category={poi.cat || "On campus"}
      icon={getCategoryIcon(poi.cat)}
      onClose={onClose}
      onDirections={onDirections}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to scrollable content */}
      <div tabIndex={0} className="detail-content">
        {poi.img && (
          <img
            src={poi.img}
            alt={poi.name}
            className="place-photo"
            onError={(e) => {
              e.currentTarget.hidden = true;
            }}
          />
        )}
        {poi.sub && <p className="detail-subtitle">{poi.sub}</p>}
        {poi.desc && <p className="detail-description">{poi.desc}</p>}
        <div className="place-facts">
          {poi.hours && (
            <div>
              <Clock size={17} />
              <span>{poi.hours}</span>
            </div>
          )}
          {poi.addr && (
            <div>
              <MapPin size={17} />
              <span>{poi.addr}</span>
            </div>
          )}
          {poi.phone && (
            <a href={`tel:${poi.phone}`}>
              <Phone size={17} />
              <span>{poi.phone}</span>
            </a>
          )}
          {poi.web && (
            <a href={poi.web} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={17} />
              <span>Visit website</span>
              <ArrowUpRight size={14} />
            </a>
          )}
          {poi.access === "true" && (
            <div className="accessible-note">
              <Accessibility size={17} />
              <span>Wheelchair accessible</span>
            </div>
          )}
        </div>
      </div>
    </DetailPanel>
  );
}
