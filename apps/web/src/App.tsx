import { ArrowUpRight, ChevronDown, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CampusMap } from "./components/CampusMap";
import { CategorySidebar } from "./components/CategorySidebar";
import { DiningDetail } from "./components/DiningDetail";
import { DirectionsSheet, type DirectionsState } from "./components/DirectionsSheet";
import { EatingClubDetail } from "./components/EatingClubDetail";
import { FreefoodDetail } from "./components/FreefoodDetail";
import { POIDetail } from "./components/POIDetail";
import { PlaceCarousel } from "./components/PlaceCarousel";
import { SearchBar } from "./components/SearchBar";
import type { DiningHallMenu, EatingClub, FreefoodPost, POI, Selection } from "./types";
import { getJSON } from "./utils/api";
import { QUICK_CATEGORIES, getCategoryIcon } from "./utils/categories";
import { type LatLng, type TravelProfile, fetchRoutes } from "./utils/directions";
import { distanceM, getRecentFix, locate } from "./utils/geolocation";

type Destination = DirectionsState["dest"];

// Map furniture that shouldn't appear as search destinations
const EXCLUDED_SEARCH_CATS = new Set(["Steps", "steps", "Ramp", "Entrance"]);

export function App() {
  const [pois, setPois] = useState<POI[]>([]);
  const [placesError, setPlacesError] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [foodFeedError, setFoodFeedError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(["@dining", "@freefood", "@clubs"]),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [freefoodPosts, setFreefoodPosts] = useState<FreefoodPost[]>([]);
  const [eatingClubs, setEatingClubs] = useState<EatingClub[]>([]);
  const [diningMenus, setDiningMenus] = useState<DiningHallMenu[]>([]);
  const [diningCurrentMeal, setDiningCurrentMeal] = useState("Lunch");

  // Single active detail panel — only one can be open at a time
  const [detail, setDetail] = useState<Selection>(null);

  const select = useCallback((next: Selection) => {
    setDetail(next);
    if (next) {
      setSidebarOpen(false);
      setDirections(null);
    }
  }, []);
  const closeDetail = useCallback(() => setDetail(null), []);

  // ── Directions ────────────────────────────────────────────────
  const [directions, setDirections] = useState<DirectionsState | null>(null);
  const lastProfile = useRef<TravelProfile>("walking");

  const startDirections = useCallback((dest: Destination) => {
    setDetail(null);
    setSidebarOpen(false);

    // Route right away from a recent fix (ours or the locate-me button's),
    // then refresh the position in the background.
    const cached = getRecentFix();
    setDirections({
      dest,
      origin: cached,
      routes: null,
      profile: lastProfile.current,
      status: cached ? "routing" : "locating",
      locateError: null,
    });

    const routeFrom = (origin: LatLng) =>
      fetchRoutes(origin, dest).then((routes) => {
        setDirections((d) => {
          if (d?.dest !== dest) return d;
          if (!routes.walking && !routes.cycling) return { ...d, status: "error" };
          const profile = routes[d.profile] ? d.profile : routes.walking ? "walking" : "cycling";
          return { ...d, origin, routes, profile, status: "ready" };
        });
      });

    if (cached) routeFrom(cached);

    locate().then((result) => {
      if (!result.ok) {
        // Already routed from the cached fix — a failed refresh doesn't matter
        if (cached) return;
        setDirections((d) =>
          d?.dest === dest ? { ...d, status: "no-location", locateError: result.error } : d,
        );
        return;
      }
      // Only re-route when the fresh fix is meaningfully away from the cached one
      if (cached && distanceM(cached, result.fix) < 30) return;
      if (!cached) {
        setDirections((d) =>
          d?.dest === dest ? { ...d, origin: result.fix, status: "routing" } : d,
        );
      }
      routeFrom(result.fix);
    });
  }, []);

  const selectProfile = useCallback((profile: TravelProfile) => {
    lastProfile.current = profile;
    setDirections((d) => (d ? { ...d, profile } : d));
  }, []);

  const retryDirections = useCallback(() => {
    if (directions) startDirections(directions.dest);
  }, [directions, startDirections]);

  const closeDirections = useCallback(() => {
    setDirections(null);
    setSearchQuery("");
  }, []);

  const pickSearchResult = useCallback(
    (poi: POI) => {
      setSearchQuery("");
      select({ kind: "poi", data: poi });
    },
    [select],
  );

  const directionsToDetail = () => {
    if (detail?.kind === "freefood") {
      const { location_name: name, lat, lng } = detail.data;
      startDirections({ name, lat, lng });
    } else if (detail) {
      startDirections(detail.kind === "dining" ? detail.data.hall : detail.data);
    }
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const scored: { poi: POI; score: number }[] = [];
    for (const poi of pois) {
      if (!poi.name || EXCLUDED_SEARCH_CATS.has(poi.cat || "")) continue;
      const name = poi.name.toLowerCase();
      let score = -1;
      if (name.startsWith(q)) score = 0;
      else if (name.includes(q)) score = 1;
      else if (poi.alt?.toLowerCase().includes(q)) score = 2;
      else if (poi.cat?.toLowerCase().startsWith(q)) score = 3;
      if (score >= 0) scored.push({ poi, score });
    }
    scored.sort((a, b) => a.score - b.score || a.poi.name.length - b.poi.name.length);
    return scored.slice(0, 7).map((s) => s.poi);
  }, [pois, searchQuery]);

  const loadPlaces = useCallback(() => {
    setPlacesError(false);
    getJSON<POI[]>("/data/pois.json")
      .then(setPois)
      .catch(() => setPlacesError(true));
  }, []);
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setDetail(null);
        setDirections(null);
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, []);

  useEffect(() => {
    getJSON<{ clubs?: EatingClub[] }>("/api/eating-clubs")
      .then((data) => setEatingClubs(data.clubs ?? []))
      .catch(() => setFeedError(true));
  }, []);

  useEffect(() => {
    getJSON<{ menus?: DiningHallMenu[]; currentMeal?: string }>("/api/dining/today")
      .then((data) => {
        setDiningMenus(data.menus ?? []);
        setDiningCurrentMeal(data.currentMeal ?? "Lunch");
      })
      .catch(() => setFeedError(true));
  }, []);

  useEffect(() => {
    const load = () =>
      getJSON<{ emails?: FreefoodPost[] }>("/api/freefood/feed?hours=9")
        .then((data) => {
          setFreefoodPosts(data.emails ?? []);
          setFoodFeedError(false);
        })
        .catch(() => setFoodFeedError(true));
    load();
    const id = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    for (const poi of pois) {
      if (!poi.name || EXCLUDED_SEARCH_CATS.has(poi.cat || "")) continue;
      const cat = poi.cat || "Other";
      cats.set(cat, (cats.get(cat) ?? 0) + 1);
    }
    const placeCategories = Array.from(cats.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
    return [
      { name: "@dining", count: diningMenus.length },
      { name: "@freefood", count: freefoodPosts.length },
      { name: "@clubs", count: eatingClubs.length },
      ...placeCategories,
    ];
  }, [pois, diningMenus, freefoodPosts, eatingClubs]);

  const filteredPOIs = useMemo(
    () =>
      pois.filter(
        (poi) =>
          activeCategories.has(poi.cat || "Other") &&
          poi.name &&
          !EXCLUDED_SEARCH_CATS.has(poi.cat || ""),
      ),
    [pois, activeCategories],
  );
  const popularPlaces = [193, 1126, 347, 359].flatMap((id) => {
    const poi = pois.find((p) => p.id === id);
    return poi ? [poi] : [];
  });

  const toggleCategory = useCallback((name: string) => {
    setDetail(null);
    setDirections(null);
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <main
      className={`map-app ${detail || directions ? "has-detail" : ""} ${searchQuery.trim() ? "is-searching" : ""}`}
    >
      <CampusMap
        pois={filteredPOIs}
        allPOIs={pois}
        freefoodPosts={activeCategories.has("@freefood") ? freefoodPosts : []}
        eatingClubs={activeCategories.has("@clubs") ? eatingClubs : []}
        diningMenus={activeCategories.has("@dining") ? diningMenus : []}
        selected={detail}
        onSelect={select}
        route={
          directions?.status === "ready" ? (directions.routes?.[directions.profile] ?? null) : null
        }
        routeOrigin={directions?.origin ?? null}
        routeDest={directions?.dest ?? null}
      />
      <div className="map-workspace">
        <header className="app-brand">
          <span className="brand-mark" aria-hidden="true">
            <MapPin size={24} strokeWidth={1.8} />
          </span>
          <div>
            <span className="brand-name">
              TigerMap<span className="brand-period">.</span>
            </span>
            <span className="brand-subtitle">Princeton University</span>
          </div>
          <a
            className="brand-byline"
            href="https://tigerapps.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TigerApps website"
          >
            by TigerApps <ArrowUpRight size={11} />
          </a>
        </header>
        <div className="map-search-tools">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            results={searchResults}
            onPick={pickSearchResult}
          />
          <div className="filter-strip">
            <div className="quick-filters" aria-label="Quick map filters">
              {QUICK_CATEGORIES.map(({ name, label }) => {
                const Icon = getCategoryIcon(name);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`filter-chip ${activeCategories.has(name) ? "is-active" : ""}`}
                    aria-pressed={activeCategories.has(name)}
                    onClick={() => toggleCategory(name)}
                  >
                    <Icon size={15} />
                    {label}
                    {name === "@freefood" && freefoodPosts.length > 0 && (
                      <span className="chip-count">{freefoodPosts.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={`icon-button filter-more ${sidebarOpen ? "is-active" : ""}`}
              aria-label={sidebarOpen ? "Hide map filters" : "All map filters"}
              aria-expanded={sidebarOpen}
              onClick={() => {
                setSidebarOpen((open) => !open);
                setDetail(null);
                setDirections(null);
              }}
            >
              <span className="t-icon-swap" data-state={sidebarOpen ? "b" : "a"} aria-hidden="true">
                <span className="t-icon" data-icon="a">
                  <SlidersHorizontal size={18} />
                </span>
                <span className="t-icon" data-icon="b">
                  <X size={18} />
                </span>
              </span>
            </button>
          </div>
        </div>
        {sidebarOpen ? (
          <CategorySidebar
            categories={categories}
            activeCategories={activeCategories}
            onToggle={toggleCategory}
            onClear={() => setActiveCategories(new Set())}
            onSelectAll={() => setActiveCategories(new Set(categories.map(({ name }) => name)))}
            onClose={() => setSidebarOpen(false)}
          />
        ) : (
          <details open className="discovery-panel">
            <summary className="discovery-intro">
              <h1>
                <span className="discovery-title">
                  <span className="discovery-title-expanded">Find your next stop.</span>
                  <span className="discovery-title-compact">
                    <MapPin size={16} aria-hidden="true" />
                    Campus essentials
                  </span>
                </span>
                <ChevronDown className="discovery-chevron" size={18} aria-hidden="true" />
              </h1>
            </summary>
            <PlaceCarousel places={popularPlaces} onPick={pickSearchResult} />
            {!pois.length && !placesError && (
              <div className="places-skeleton" aria-label="Loading campus places">
                <span />
                <span />
                <span />
              </div>
            )}
            {placesError && (
              <div className="empty-state">
                Campus places couldn’t load.{" "}
                <button type="button" className="text-button" onClick={loadPlaces}>
                  Try again
                </button>
              </div>
            )}
            {(feedError || foodFeedError) && (
              <div className="discovery-footer">Some live updates are unavailable</div>
            )}
          </details>
        )}
      </div>
      {detail?.kind === "poi" && (
        <POIDetail
          key={detail.data.id}
          poi={detail.data}
          onClose={closeDetail}
          onDirections={directionsToDetail}
        />
      )}
      {detail?.kind === "freefood" && (
        <FreefoodDetail
          key={detail.data.id}
          post={detail.data}
          onClose={closeDetail}
          onDirections={directionsToDetail}
        />
      )}
      {detail?.kind === "club" && (
        <EatingClubDetail
          key={detail.data.name}
          club={detail.data}
          onClose={closeDetail}
          onDirections={directionsToDetail}
        />
      )}
      {detail?.kind === "dining" && (
        <DiningDetail
          key={detail.data.hall.id}
          menu={detail.data}
          currentMeal={diningCurrentMeal}
          onClose={closeDetail}
          onDirections={directionsToDetail}
        />
      )}
      {directions && (
        <DirectionsSheet
          key={`${directions.dest.lat}-${directions.dest.lng}`}
          state={directions}
          onSelectProfile={selectProfile}
          onRetry={retryDirections}
          onClose={closeDirections}
        />
      )}
    </main>
  );
}
