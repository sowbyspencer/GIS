// Import the necessary ArcGIS modules
import esriConfig from "esri/config";
import Map from "esri/Map";
import MapView from "esri/views/MapView";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import ScaleBar from "esri/widgets/ScaleBar";

import { BASEMAP, DEFAULT_CENTER, DEFAULT_ZOOM } from "./config.js";

export function initializeMap() {
  esriConfig.apiKey = "YOUR_API_KEY_HERE"; // Replace with your actual API key

  const map = new Map({ basemap: BASEMAP });
  const view = new MapView({
    container: "viewDiv",
    map,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    constraints: { snapToZoom: false },
  });

  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");

  return { view, graphicsLayer };
}
