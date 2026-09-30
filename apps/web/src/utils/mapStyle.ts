import type { StyleSpecification } from "mapbox-gl";

const FILL_COLORS: Record<string, string> = {
  water: "#b9d2d1",
  "road-polygon": "#faf7ef",
  "detail-polygon": "#d4decb",
  "buildings-shadow": "rgba(70, 61, 48, 0.08)",
  underpass: "#ddd5c7",
};

export function polishMapStyle(style: StyleSpecification): StyleSpecification {
  for (const layer of style.layers) {
    if (layer.type === "background") layer.paint = { "background-color": "#eae9df" };
    if (layer.type === "fill") {
      if (layer.id === "Constuction Fill") {
        layer.paint = { "fill-color": "#e2dccb", "fill-opacity": 0.7 };
      } else if (FILL_COLORS[layer.id]) {
        layer.paint = { ...layer.paint, "fill-color": FILL_COLORS[layer.id] };
      } else if (layer.id === "landuse copy") {
        layer.paint = {
          ...layer.paint,
          "fill-color": [
            "match",
            ["get", "class"],
            "grass",
            "#dce5d0",
            "pitch",
            "#d1dec5",
            "sand",
            "#e8dfcb",
            "#e6eadb",
          ],
        };
      } else if (layer.id === "buildings") {
        layer.paint = {
          ...layer.paint,
          "fill-color": [
            "match",
            ["get", "style_rank"],
            [1],
            "#e5cbb2",
            [2],
            "#d6cfc3",
            [3],
            "#e2ddd3",
            "rgba(0,0,0,0)",
          ],
        };
      }
    }
    if (layer.type === "line") {
      const color =
        layer.id.includes("buildings") || layer.id.includes("underpass")
          ? "#b4aa99"
          : layer.id.includes("road")
            ? "#f7f3e9"
            : "#b9c3ac";
      layer.paint = { ...layer.paint, "line-color": color };
      if (layer.id === "Inclines") layer.paint["line-opacity"] = 0.25;
    }
    if (layer.type === "symbol") {
      if (
        ["public-art", "princeton_line", "bus_stops", "place-label", "quarter-label"].includes(
          layer.id,
        )
      ) {
        layer.layout = { ...layer.layout, visibility: "none" };
        continue;
      }
      layer.paint = {
        ...layer.paint,
        "text-color": layer.id === "greenspace_label" ? "#647459" : "#5c6055",
        "text-halo-color": "#f5f3e9",
        "text-halo-width": 1.2,
      };
      if (layer.id === "poi-label") {
        layer.layout = {
          ...layer.layout,
          "icon-image": "",
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 16, 11, 19, 15],
          "text-transform": "none",
          "text-anchor": "center",
          "text-justify": "center",
          "text-field": ["get", "name"],
          "text-padding": 4,
          "text-max-width": 8,
        };
      } else if (["road-label", "greenspace_label", "waterway-label"].includes(layer.id)) {
        layer.layout = {
          ...layer.layout,
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 8, 19, 13],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-letter-spacing": 0.06,
        };
      }
    }
  }
  return style;
}
