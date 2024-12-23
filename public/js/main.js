// js/main.js
require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/widgets/ScaleBar",
], function (esriConfig, Map, MapView, GraphicsLayer, ScaleBar) {
  // Initialize the map and view
  esriConfig.apiKey = "YOUR_API_KEY_HERE";

  const map = new Map({ basemap: "arcgis-navigation" });
  const view = new MapView({
    container: "viewDiv",
    map,
    center: [-117.133163, 34.022445],
    zoom: 10,
    constraints: { snapToZoom: false },
  });

  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");

  console.log("Map initialized successfully.");
});
