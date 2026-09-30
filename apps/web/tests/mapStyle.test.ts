import { expect, test } from "bun:test";
import type { StyleSpecification } from "mapbox-gl";
import spec from "mapbox-gl/dist/style-spec/index.cjs";
import { polishMapStyle } from "../src/utils/mapStyle";

test("campus restyling stays valid and preserves map data and label visibility rules", () => {
  const style: StyleSpecification = {
    version: 8,
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    sources: { campus: { type: "geojson", data: { type: "FeatureCollection", features: [] } } },
    layers: [
      { id: "background", type: "background" },
      { id: "buildings", type: "fill", source: "campus" },
      { id: "road-polygon", type: "fill", source: "campus" },
      {
        id: "Constuction Fill",
        type: "fill",
        source: "campus",
        paint: { "fill-pattern": "construction" },
      },
      {
        id: "poi-label",
        type: "symbol",
        source: "campus",
        minzoom: 14,
        filter: ["==", ["get", "style_rank"], 1],
        paint: { "text-opacity": ["step", ["zoom"], 0, 16, 1] },
        layout: { "icon-image": "landmark", "text-field": ["get", "name"] },
      },
      { id: "public-art", type: "symbol", source: "campus" },
    ],
  };
  const sources = structuredClone(style.sources);
  const filter = structuredClone(style.layers[4].filter);
  const result = polishMapStyle(style);
  expect(spec.validate(result).map((error: { message: string }) => error.message)).toEqual([]);
  expect(result.sources).toEqual(sources);
  expect(result.layers[4].filter).toEqual(filter);
  expect(result.layers[4].minzoom).toBe(14);
  expect(result.layers[4].paint?.["text-opacity"]).toEqual(["step", ["zoom"], 0, 16, 1]);
  expect(result.layers[3].paint).not.toHaveProperty("fill-pattern");
  expect(result.layers[5].layout?.visibility).toBe("none");
});
