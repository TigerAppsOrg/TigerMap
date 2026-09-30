import { Bike, ChevronDown, Footprints, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { LatLng, RouteInfo, TravelProfile } from "../utils/directions";
import { formatArrival, formatDistance, formatMinutes } from "../utils/directions";
import type { LocateError } from "../utils/geolocation";
import { DetailPanel } from "./DetailPanel";

export interface DirectionsState {
  dest: { name: string; lat: number; lng: number; cat?: string };
  origin: LatLng | null;
  routes: Partial<Record<TravelProfile, RouteInfo>> | null;
  profile: TravelProfile;
  status: "locating" | "routing" | "ready" | "no-location" | "error";
  /** Why locating failed, when status is "no-location" */
  locateError: LocateError | null;
}

const LOCATE_MESSAGES: Record<LocateError, string> = {
  denied: "Location is blocked for this site",
  unavailable: "Your location couldn’t be found",
  unsupported: "This browser can't share your location",
};

interface DirectionsSheetProps {
  state: DirectionsState;
  onSelectProfile: (profile: TravelProfile) => void;
  onRetry: () => void;
  onClose: () => void;
}

function ModeButton({
  profile,
  route,
  active,
  loading,
  onClick,
}: {
  profile: TravelProfile;
  route: RouteInfo | undefined;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const Icon = profile === "walking" ? Footprints : Bike;
  const label = profile === "walking" ? "Walk" : "Bike";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || !route}
      aria-pressed={active}
      className={`travel-mode ${active && route ? "is-active" : ""}`}
    >
      <Icon size={20} />
      <span>
        {label}
        <strong>
          {loading ? (
            <LoaderCircle size={16} className="loading-spinner" aria-label="Loading route" />
          ) : route ? (
            formatMinutes(route.durationS)
          ) : (
            "Unavailable"
          )}
        </strong>
      </span>
    </button>
  );
}

export function DirectionsSheet({
  state,
  onSelectProfile,
  onRetry,
  onClose,
}: DirectionsSheetProps) {
  const { dest, routes, profile, status } = state;
  const active = routes?.[profile];
  const loading = status === "locating" || status === "routing";
  const [expanded, setExpanded] = useState(false);
  const subline = loading
    ? status === "locating"
      ? "Finding your location…"
      : "Planning your route…"
    : status === "ready" && active
      ? `${formatDistance(active.distanceM)} · Arrive at ${formatArrival(active.durationS)}`
      : status === "no-location"
        ? LOCATE_MESSAGES[state.locateError ?? "unavailable"]
        : "A route couldn’t be found";

  return (
    <DetailPanel
      title={dest.name}
      category="Directions"
      icon={MapPin}
      onClose={onClose}
      className="directions-sheet"
      expanded={expanded}
      onExpandedChange={setExpanded}
    >
      <div className="directions-content">
        <p className="route-summary" aria-live="polite">
          {loading && <LoaderCircle size={15} className="loading-spinner" />}
          {subline}
        </p>
        {status === "no-location" || status === "error" ? (
          <div className="route-error">
            {state.locateError !== "unsupported" && (
              <button type="button" className="primary-button" onClick={onRetry}>
                <RefreshCw size={16} />
                Try again
              </button>
            )}
            {status === "no-location" && state.locateError === "denied" && (
              <p>Allow location in your browser’s site settings, then try again.</p>
            )}
            {status === "error" && <p>Check your connection or try another campus destination.</p>}
          </div>
        ) : (
          <div className="travel-modes">
            {(["walking", "cycling"] as const).map((mode) => (
              <ModeButton
                key={mode}
                profile={mode}
                route={routes?.[mode]}
                active={profile === mode}
                loading={loading}
                onClick={() => onSelectProfile(mode)}
              />
            ))}
          </div>
        )}
        {status === "ready" && active && active.steps.length > 0 && (
          <>
            <button
              type="button"
              className="steps-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              Route steps
              <ChevronDown size={17} className={expanded ? "is-expanded" : ""} />
            </button>
            <div className={`steps-wrap ${expanded ? "steps-open" : ""}`}>
              <div className="steps-inner">
                {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to scrollable route steps */}
                <ol tabIndex={0} aria-label="Route steps" className="steps-list">
                  {active.steps.map((step, i) => (
                    <li key={`${i}-${step.instruction}`}>
                      <span className="step-number">{i + 1}</span>
                      <span>{step.instruction}</span>
                      {step.distanceM > 0 && (
                        <span className="step-distance">{formatDistance(step.distanceM)}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </DetailPanel>
  );
}
