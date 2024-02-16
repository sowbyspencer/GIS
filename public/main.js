// import { ApiKeyManager } from "@esri/arcgis-rest-request";
// import { geocode } from "@esri/arcgis-rest-geocoding";

// geocode({
//   address: "1600 Pennsylvania Ave",
//   postal: 20500,
//   countryCode: "USA",
//   authentication: ApiKeyManager.fromkey("AAPK8e49e4e2abd64d5a90248a616a7a84b5wpFnclWyrsIGlXMXKmPOLW47c2Zf_jA3a8q4djCkHVQTAiU454MiP_yKiZGqtNvy")
// })

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer"
], function(Map, MapView, Graphic, GraphicsLayer) {
  var map = new Map({
    basemap: "streets-vector"
  });

  var view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 12
  });

  // Graphics layer to hold markers
  var graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  // Array of marker locations
  var markerLocations = [
    { latitude: 65.0, longitude: 15.0, info: "Marker 1" },
    { latitude: 65.5, longitude: 15.5, info: "Marker 2" },
    { latitude: 66.0, longitude: 16.0, info: "Marker 3" }
  ];

  // Add markers to the map
  markerLocations.forEach(function(location) {
    var point = {
      type: "point",
      longitude: location.longitude,
      latitude: location.latitude
    };

    var markerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40], // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };

    var popupTemplate = {
      title: "Marker Information",
      content: location.info
    };

    var markerGraphic = new Graphic({
      geometry: point,
      symbol: markerSymbol,
      popupTemplate: popupTemplate
    });

    graphicsLayer.add(markerGraphic);
  });

  // Get the user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      view.center = [position.coords.longitude, position.coords.latitude];
    }, function(error) {
      console.error("Error getting user location: ", error);
      // Set a default location if access to user location is denied
      view.center = [15, 65]; // Default longitude, latitude
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
    // Set a default location if geolocation is not supported
    view.center = [15, 65]; // Default longitude, latitude
  }
});