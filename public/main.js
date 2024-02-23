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
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/rest/networkService",
  "esri/rest/serviceArea",
  "esri/rest/support/ServiceAreaParameters",
  "esri/layers/GraphicsLayer",
  "esri/rest/support/FeatureSet",
  "esri/Graphic",
  "esri/widgets/ScaleBar",
], function (
  esriConfig,
  Map,
  MapView,
  networkService,
  serviceArea,
  ServiceAreaParameters,
  GraphicsLayer,
  FeatureSet,
  Graphic,
  ScaleBar
) {
  esriConfig.apiKey =
    "AAPK8e49e4e2abd64d5a90248a616a7a84b5wpFnclWyrsIGlXMXKmPOLW47c2Zf_jA3a8q4djCkHVQTAiU454MiP_yKiZGqtNvy";
  const url =
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";
  let travelMode = null;

  const map = new Map({
    basemap: "arcgis-navigation",
  });

  const view = new MapView({
    container: "viewDiv",
    map,
    center: [-117.133163, 34.022445],
    zoom: 13,
    constraints: {
      snapToZoom: false,
    },
  });

  var graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");
  view.when(() => {
    createServiceAreas(view.center);
  });

  view.on("click", (event) => {
    createServiceAreas(event.mapPoint);
  });

  function createServiceAreas(point) {
    // Remove any existing graphics
    view.graphics.removeAll();
    const locationGraphic = createGraphic(point);
    findServiceArea(locationGraphic);
  }

  // Create the location graphic
  function createGraphic(geometry) {
    // Create a and add the point
    const graphic = new Graphic({
      geometry,
      symbol: {
        type: "simple-marker",
        color: "white",
        size: 8,
      },
    });
    view.graphics.add(graphic);
    return graphic;
  }

  async function findServiceArea(locationFeature) {
    if (!travelMode) {
      const networkDescription =
        await networkService.fetchServiceDescription(url);
      travelMode = networkDescription.supportedTravelModes.find(
        (travelMode) => travelMode.name === "Walking Distance"
      );
    }

    const serviceAreaParameters = new ServiceAreaParameters({
      facilities: new FeatureSet({
        features: [locationFeature],
      }),
      defaultBreaks: [2.5], // km
      travelMode,
      travelDirection: "to-facility",
      outSpatialReference: view.spatialReference,
      trimOuterPolygon: true,
    });
    const { serviceAreaPolygons } = await serviceArea.solve(
      url,
      serviceAreaParameters
    );
    showServiceAreas(serviceAreaPolygons);
  }

  function showServiceAreas(serviceAreaPolygons) {
    const graphics = serviceAreaPolygons.features.map((g) => {
      g.symbol = {
        type: "simple-fill",
        color: "rgba(255, 0, 0, 0.25)",
      };
      return g;
    });
    view.graphics.addMany(graphics, 0);
  }

  // Function to fetch and display places using Google Places API
  function fetchPlaces(lat, lon) {
    var service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    var location = new google.maps.LatLng(lat, lon);
    var request = {
      location: location,
      radius: "5000",
        // type: ['hospital', 'store', 'bank', 'museum', 'church', 'atm', 'gas_station', 'library', 'zoo', 'airport', 'gym', 'movie_theater', 'hotel', 'restaurant', 'school', 'park']
      type: ['restaurant'],
    };

    service.nearbySearch(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(function (place) {
          var point = {
            type: "point",
            longitude: place.geometry.location.lng(),
            latitude: place.geometry.location.lat(),
          };

          var markerSymbol = {
            type: "simple-marker",
            color: [226, 119, 40], // Orange
            outline: {
              color: [255, 255, 255], // White
              width: 1,
            },
          };

          var popupTemplate = {
            title: "Place Information",
            content: place.name,
          };

          var markerGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            popupTemplate: popupTemplate,
          });

          graphicsLayer.add(markerGraphic);
        });
      }
    });
  }

  // Get the user's location or use the default location
  var defaultLat = 65;
  var defaultLon = 15;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        view.center = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        // Call fetchPlaces with the user's location
        fetchPlaces(position.coords.latitude, position.coords.longitude);
      },
      function (error) {
        console.error("Error getting user location: ", error);
        view.center = [defaultLon, defaultLat];
        // Call fetchPlaces with the default location
        fetchPlaces(defaultLat, defaultLon);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    view.center = [defaultLon, defaultLat];
    // Call fetchPlaces with the default location
    fetchPlaces(defaultLat, defaultLon);
  }
});