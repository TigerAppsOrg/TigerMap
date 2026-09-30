import { Coffee, LocateFixed, MapPin, Pizza, RotateCcw, Users, Utensils } from "lucide-react";
import type { Marker as MapboxMarker, StyleSpecification } from "mapbox-gl";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GeolocateControl,
  Layer,
  Map as MapGL,
  type MapRef,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/mapbox";
import type { DiningHallMenu, EatingClub, FreefoodPost, POI, Selection } from "../types";
import { getCategoryColor, getCategoryIcon } from "../utils/categories";
import type { LatLng, RouteInfo } from "../utils/directions";
import { rememberFix } from "../utils/geolocation";
import { polishMapStyle } from "../utils/mapStyle";

const CAMPUS_MAP_TOKEN = import.meta.env.VITE_CAMPUS_MAP_TOKEN;
const CAMPUS_MAP_STYLE = import.meta.env.VITE_CAMPUS_MAP_STYLE;
const TIGERAPPS_TOKEN = import.meta.env.VITE_TIGERAPPS_MAPBOX_TOKEN;
const CAMPUS_CENTER: [number, number] = [-74.6554, 40.3473];
const motionDuration = (duration: number) =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;

function presentMarker(marker: MapboxMarker | null) {
  const element = marker?.getElement();
  if (!element) return;
  element.setAttribute("role", "presentation");
  element.removeAttribute("tabindex");
  element.removeAttribute("aria-label");
}

function PlaceMarker({
  at,
  label,
  tooltip,
  className = "",
  color,
  selected,
  onSelect,
  children,
}: {
  at: LatLng;
  label: string;
  tooltip: string;
  className?: string;
  color?: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Marker ref={presentMarker} longitude={at.lng} latitude={at.lat} anchor="center">
      <button
        type="button"
        className={`map-marker ${className}`}
        style={color ? ({ "--marker-color": color } as CSSProperties) : undefined}
        aria-label={label}
        aria-pressed={selected}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <span className="marker-disc">{children}</span>
        <span className="marker-tooltip">{tooltip}</span>
      </button>
    </Marker>
  );
}

interface CampusMapProps {
  pois: POI[];
  allPOIs: POI[];
  freefoodPosts: FreefoodPost[];
  eatingClubs: EatingClub[];
  diningMenus: DiningHallMenu[];
  selected: Selection;
  onSelect: (selection: Selection) => void;
  route: RouteInfo | null;
  routeOrigin: LatLng | null;
  routeDest: { name: string; lat: number; lng: number } | null;
}

export function CampusMap({
  pois,
  allPOIs,
  freefoodPosts,
  eatingClubs,
  diningMenus,
  selected,
  onSelect,
  route,
  routeOrigin,
  routeDest,
}: CampusMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<StyleSpecification>();
  const [mapFailed, setMapFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadStyle = useCallback(async (signal?: AbortSignal) => {
    setMapFailed(false);
    setMapStyle(undefined);
    setLoaded(false);
    try {
      const styleId = (
        CAMPUS_MAP_STYLE || "mapbox://styles/applied-information-group/cld1kdenc001001m89xs12zvl"
      ).replace("mapbox://styles/", "");
      const response = await fetch(
        `https://api.mapbox.com/styles/v1/${styleId}?access_token=${CAMPUS_MAP_TOKEN}`,
        { signal },
      );
      if (!response.ok) throw new Error("Map unavailable");
      const style: StyleSpecification = await response.json();
      if (TIGERAPPS_TOKEN) {
        style.sources.tigerapps = {
          url: "mapbox://tigerapps.downtown-princeton-buildings,tigerapps.8mfuncwk",
          type: "vector",
        };
        const beforeLabels = style.layers.findIndex((layer) => layer.type === "symbol");
        style.layers.splice(
          beforeLabels < 0 ? style.layers.length : beforeLabels,
          0,
          {
            id: "downtown-buildings",
            type: "fill",
            source: "tigerapps",
            "source-layer": "Downtown Princeton Buildings",
            paint: { "fill-color": "#ddd5c7", "fill-outline-color": "#b4aa99" },
          },
          {
            id: "highlighted-restaurants",
            type: "fill",
            source: "tigerapps",
            "source-layer": "highlighted-restaurants-3jo06s",
            paint: { "fill-color": "#e5cbb2", "fill-outline-color": "#c7a98e" },
          },
        );
      }
      setMapStyle(polishMapStyle(style));
    } catch {
      if (!signal?.aborted) setMapFailed(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStyle(controller.signal);
    return () => controller.abort();
  }, [loadStyle]);

  const focus = selected?.kind === "dining" ? selected.data.hall : selected?.data;
  const selectedPOI = selected?.kind === "poi" ? selected.data : null;
  useEffect(() => {
    if (!loaded || routeDest) return;
    if (!focus) {
      mapRef.current?.easeTo({
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: motionDuration(300),
      });
      return;
    }
    const mobile = window.innerWidth < 700;
    mapRef.current?.flyTo({
      center: [focus.lng, focus.lat],
      zoom: 17,
      padding: mobile
        ? {
            top: 210,
            bottom: Math.min(window.innerHeight * 0.65, window.innerHeight - 220) + 16,
            left: 36,
            right: 36,
          }
        : { top: 180, bottom: 100, left: 80, right: 460 },
      duration: motionDuration(650),
    });
  }, [focus, loaded, routeDest]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeDest || !loaded) return;
    const mobile = window.innerWidth < 700;
    if (route) {
      const coords = [...route.geometry.coordinates, [routeDest.lng, routeDest.lat]];
      if (routeOrigin) coords.push([routeOrigin.lng, routeOrigin.lat]);
      const lngs = coords.map((point) => point[0]);
      const lats = coords.map((point) => point[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        {
          padding: mobile
            ? { top: 190, bottom: 310, left: 40, right: 70 }
            : { top: 240, bottom: 100, left: 80, right: 460 },
          duration: motionDuration(700),
          maxZoom: 17.5,
        },
      );
    } else {
      map.flyTo({
        center: [routeDest.lng, routeDest.lat],
        zoom: 16.5,
        duration: motionDuration(500),
      });
    }
  }, [route, routeOrigin, routeDest, loaded]);

  const visiblePOIs =
    selectedPOI && !pois.some((poi) => poi.id === selectedPOI.id) ? [...pois, selectedPOI] : pois;

  return (
    <div className={`campus-map ${loaded ? "is-loaded" : ""}`}>
      {(!loaded || mapFailed) && (
        <div className="map-loading" aria-live="polite">
          <div className="map-loading-symbol">
            <MapPin size={28} />
          </div>
          {mapFailed ? (
            <>
              <p>The campus map couldn’t load.</p>
              <button type="button" className="primary-button" onClick={() => loadStyle()}>
                Retry
              </button>
            </>
          ) : (
            <span className="sr-only">Loading campus map</span>
          )}
        </div>
      )}
      {mapStyle && (
        <MapGL
          ref={mapRef}
          mapboxAccessToken={CAMPUS_MAP_TOKEN}
          transformRequest={(url) => ({
            url:
              url.includes("tigerapps.") && TIGERAPPS_TOKEN
                ? url.replace(/access_token=[^&]+/, `access_token=${TIGERAPPS_TOKEN}`)
                : url,
          })}
          initialViewState={{
            longitude: CAMPUS_CENTER[0],
            latitude: CAMPUS_CENTER[1],
            zoom: 15.9,
            pitch: 0,
            bearing: 0,
          }}
          minZoom={14}
          maxZoom={19}
          maxBounds={[
            [-74.675, 40.335],
            [-74.645, 40.358],
          ]}
          mapStyle={mapStyle}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={["poi-label"]}
          onLoad={() => {
            setLoaded(true);
            setMapFailed(false);
          }}
          onError={() => {
            if (!loaded) setMapFailed(true);
          }}
          onClick={(event) => {
            if (
              event.originalEvent.target instanceof Element &&
              event.originalEvent.target.closest(".map-marker")
            )
              return;
            const id = event.features?.[0]?.properties?.id;
            const poi = allPOIs.find((point) => point.id === Number(id));
            onSelect(poi ? { kind: "poi", data: poi } : null);
          }}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          <GeolocateControl
            position="bottom-right"
            trackUserLocation
            showUserHeading
            positionOptions={{ enableHighAccuracy: true }}
            onGeolocate={(event) =>
              rememberFix({
                lat: event.coords.latitude,
                lng: event.coords.longitude,
                accuracy: event.coords.accuracy,
                at: Date.now(),
              })
            }
          />
          <div className="reset-map-control">
            <button
              type="button"
              className="icon-button"
              aria-label="Reset map to campus"
              title="Back to campus"
              onClick={() =>
                mapRef.current?.flyTo({
                  center: CAMPUS_CENTER,
                  zoom: 15.9,
                  bearing: 0,
                  pitch: 0,
                  padding: { top: 0, bottom: 0, left: 0, right: 0 },
                  duration: motionDuration(650),
                })
              }
            >
              <RotateCcw size={18} />
            </button>
          </div>
          {route && (
            <Source
              id="route"
              type="geojson"
              data={{ type: "Feature", properties: {}, geometry: route.geometry }}
            >
              <Layer
                id="route-casing"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{ "line-color": "#fcfaf5", "line-width": 9, "line-opacity": 0.9 }}
              />
              <Layer
                id="route-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{ "line-color": "#ad4d20", "line-width": 5 }}
              />
            </Source>
          )}
          {routeOrigin && (
            <Marker
              ref={presentMarker}
              longitude={routeOrigin.lng}
              latitude={routeOrigin.lat}
              anchor="center"
            >
              <div className="route-origin-dot" role="img" aria-label="Your location" />
            </Marker>
          )}
          {routeDest && (
            <Marker
              ref={presentMarker}
              longitude={routeDest.lng}
              latitude={routeDest.lat}
              anchor="center"
            >
              <span className="route-destination" role="img" aria-label="Destination">
                <MapPin size={21} />
              </span>
            </Marker>
          )}
          {visiblePOIs.map((poi) => {
            const Icon = getCategoryIcon(poi.cat);
            return (
              <PlaceMarker
                key={poi.id}
                at={poi}
                label={poi.name || poi.cat || "Place"}
                tooltip={poi.name || poi.cat || ""}
                color={getCategoryColor(poi.cat)}
                selected={selectedPOI?.id === poi.id}
                onSelect={() => onSelect({ kind: "poi", data: poi })}
              >
                <Icon size={15} />
              </PlaceMarker>
            );
          })}
          {freefoodPosts.map((post) => (
            <PlaceMarker
              key={`food-${post.id}`}
              at={post}
              className="food-marker"
              label={`Free food: ${post.subject}`}
              tooltip={`Free food · ${post.location_name}`}
              selected={selected?.kind === "freefood" && selected.data.id === post.id}
              onSelect={() => onSelect({ kind: "freefood", data: post })}
            >
              <Pizza size={17} />
            </PlaceMarker>
          ))}
          {eatingClubs.map((club) => (
            <PlaceMarker
              key={club.name}
              at={club}
              className="club-marker"
              label={`${club.name}, ${club.eventCount} recent events`}
              tooltip={club.name}
              selected={selected?.kind === "club" && selected.data.name === club.name}
              onSelect={() => onSelect({ kind: "club", data: club })}
            >
              <Users size={16} />
              {club.eventCount > 0 && <span className="marker-activity" />}
            </PlaceMarker>
          ))}
          {diningMenus.map((menu) => {
            const Icon = menu.hall.category === "residential" ? Utensils : Coffee;
            return (
              <PlaceMarker
                key={menu.hall.id}
                at={menu.hall}
                className="dining-marker"
                label={`Menu: ${menu.hall.name}`}
                tooltip={menu.hall.name}
                selected={selected?.kind === "dining" && selected.data.hall.id === menu.hall.id}
                onSelect={() => onSelect({ kind: "dining", data: menu })}
              >
                <Icon size={16} />
              </PlaceMarker>
            );
          })}
        </MapGL>
      )}
      <span className="map-context">
        <LocateFixed size={13} /> Princeton, New Jersey
      </span>
    </div>
  );
}
