// import { ApiKeyManager } from "@esri/arcgis-rest-request";
// import { geocode } from "@esri/arcgis-rest-geocoding";

// geocode({
//   address: "1600 Pennsylvania Ave",
//   postal: 20500,
//   countryCode: "USA",
//   authentication: ApiKeyManager.fromkey("AAPK8e49e4e2abd64d5a90248a616a7a84b5wpFnclWyrsIGlXMXKmPOLW47c2Zf_jA3a8q4djCkHVQTAiU454MiP_yKiZGqtNvy")
// })

/* The code is using the `require` function to import the necessary modules from
the ArcGIS API for JavaScript. It is importing the `Map`, `MapView`, `Graphic`,
and `GraphicsLayer` modules. */
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

  var graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  var username = "your_username"; // Replace with your GeoNames username

  // Function to fetch city data based on latitude and longitude
  function fetchCityData(lat, lon) {
    var north = lat + 1; // Adjust the value as needed
    var south = lat - 1; // Adjust the value as needed
    var east = lon + 1; // Adjust the value as needed
    var west = lon - 1; // Adjust the value as needed

    fetch(`http://api.geonames.org/citiesJSON?north=${north}&south=${south}&east=${east}&west=${west}&lang=en&username=${username}`)
      .then(response => response.json())
      .then(data => {
        // Add markers to the map based on the fetched data
      })
      .catch(error => console.error("Error fetching city data: ", error));
  }

  // Get the user's location or use the default location
  var defaultLat = 65;
  var defaultLon = 15;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      view.center = [position.coords.longitude, position.coords.latitude];
      fetchCityData(position.coords.latitude, position.coords.longitude);
    }, function(error) {
      console.error("Error getting user location: ", error);
      view.center = [defaultLon, defaultLat];
      fetchCityData(defaultLat, defaultLon);
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
    view.center = [defaultLon, defaultLat];
    fetchCityData(defaultLat, defaultLon);
  }

  // Function to set a new location and fetch data
  function setNewLocation(lat, lon) {
    view.center = [lon, lat];
    fetchCityData(lat, lon);
  }

  // Example usage of setNewLocation
  // setNewLocation(40.7128, -74.0060); // New York City
});
