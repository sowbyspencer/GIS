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

  /* Holds the URL endpoint for the ServiceArea_World ArcGIS REST service, used to calculate 
  service areas from locations using the ArcGIS API. */
  const url =
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";
  let travelMode = null;

  /* Create a new map using the ArcGIS API for JavaScript, with the basemap set to 
  "arcgis-navigation" for navigation purposes. */
  const map = new Map({
    basemap: "arcgis-navigation",
  });

  /* This code snippet is creating a new MapView instance.*/
  const view = new MapView({
    container: "viewDiv",
    map,
    center: [-117.133163, 34.022445],
    zoom: 10,
    constraints: {
      snapToZoom: false,
    },
  });

  /* Create a new GraphicsLayer instance to display points, lines, and polygons on the map.
  Adding graphicsLayer to the map shows any graphics in this layer within the view. */
  var graphicsLayer = new GraphicsLayer();

  /* Add graphicsLayer to the map to display graphics like points, lines, and polygons.*/
  map.add(graphicsLayer);
  view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");

  /* Create an event listener to call createServiceAreas with the map view's center as the 
  input once the view is ready.*/
  view.when(() => {
    createServiceAreas(view.center);
  });

  // Adds event listener to view, triggering createServiceAreas with clicked mapPoint
  view.on("click", (event) => {
    createServiceAreas(event.mapPoint);
  });

  /**
   * Function createServiceAreas removes existing graphics, creates a new graphic at a specified
   * point, and calculates the service area for that location.
   * @param point - Geographic point representing a location on the map. Used to create service
   * areas around that location.
   */
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

  /**
   * Calculates and displays the service area for a given location feature.
   * @param locationFeature - The feature that defines the center point for the
   * service area calculation.
   */
  async function findServiceArea(locationFeature) {
    // Show the loading overlay
    document.getElementById("loadingOverlay").innerHTML = '<div id="loadingSpinner"></div>Calculating Overlay...'
    document.getElementById("loadingOverlay").style.display = "flex";
    

    if (!travelMode) {
      const networkDescription = await networkService.fetchServiceDescription(
        url
      );
      travelMode = networkDescription.supportedTravelModes.find(
        (travelMode) => travelMode.name === "Driving Time"
      );
    }

    // Calculate and display the service area for a given location feature on a map.
    const serviceAreaParameters = new ServiceAreaParameters({
      facilities: new FeatureSet({
        features: [locationFeature],
      }),
      defaultBreaks: [30], // minutes
      travelMode,
      travelDirection: "from-facility",
      outSpatialReference: view.spatialReference,
      trimOuterPolygon: true,
    });

    try {
      // Perform the following actions:
      // - Use the `serviceArea.solve` method to calculate service areas.
      // - Pass `url` and `serviceAreaParameters` as arguments to the `solve` method.
      // - Use destructuring to extract the `serviceAreaPolygons` from the result of the `solve` method.
      const { serviceAreaPolygons } = await serviceArea.solve(
        url,
        serviceAreaParameters
      );

      showServiceAreas(serviceAreaPolygons);

      // Hide the loading overlay once the calculation is complete
      document.getElementById("loadingOverlay").style.display = "none";
    } catch (error) {
      console.error("Error solving service area: ", error);
      // Hide the loading overlay in case of an error
      document.getElementById("loadingOverlay").style.display = "none";
    }
  }

  /**
   * Function `showServiceAreas` adds service area polygons with a red semi-transparent fill
   * to a graphics layer in a view.
   * @param serviceAreaPolygons - Object containing features representing polygons that define
   * service areas. Each feature should have a `symbol` property specifying the visualization
   * style.
   */
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

  /**
   * Fetch nearby restaurants based on a given latitude and longitude, and display them as markers on a map.
   * @param lat - Latitude coordinate of the location to search for nearby restaurants.
   * @param lon - Longitude coordinate of the location to fetch nearby restaurants.
   */
  function fetchPlaces(lat, lon) {
    var service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    var location = new google.maps.LatLng(lat, lon);
    var request = {
      location: location,
      radius: "5000",
      // type: ['hospital', 'store', 'bank', 'museum', 'church', 'atm', 'gas_station', 'library', 'zoo', 'airport', 'gym', 'movie_theater', 'hotel', 'restaurant', 'school', 'park']
      type: ["restaurant"],
    };

    // Use the `service.nearbySearch` function to fetch nearby places based on
    // latitude and longitude coordinates. Send a request to the Google Maps Places API
    // to search for places within a specified radius of the provided location.
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

          // Define the content to be displayed in a popup when a user clicks on a marker
          // representing a place (e.g., a restaurant) on the map.
          var popupTemplate = {
            title: "Place Information",
            content: place.name,
          };

          // Create a new graphic object representing a marker on the map.
          // Properties:
          // - geometry: Point geometry for the marker.
          // - symbol: Symbol used to display the marker.
          // - popupTemplate: Template for the popup displayed when the marker is clicked.
          var markerGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            popupTemplate: popupTemplate,
          });

          // Add a markerGraphic object to the graphicsLayer.
          graphicsLayer.add(markerGraphic);
        });
      }
    });
  }

  /**
   * The function `locationAndPlaces` retrieves the user's geolocation and
   * displays nearby restaurants on a map, handling errors and using default
   * location if needed.
   */
  function locationAndPlaces() {
    // Get the user's location or use the default location
    var defaultLat = 65;
    var defaultLon = 15;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Callback function executed when the user's geolocation is successfully retrieved.
        // Sets the center of the map view to the user's current location using longitude and
        // latitude coordinates from geolocation data.
        // Calls the `fetchPlaces` function with the user's latitude and longitude coordinates
        // to fetch nearby restaurants and display them as markers on the map.
        function (position) {
          view.center = [position.coords.longitude, position.coords.latitude];
          // Call fetchPlaces with the user's location
          fetchPlaces(position.coords.latitude, position.coords.longitude);
        },

        // Callback function handling errors when attempting to retrieve the user's geolocation.
        // Displays an error message indicating that geolocation is not available or permission is denied.
        function (error) {
          console.error("Error getting user location: ", error);
          view.center = [defaultLon, defaultLat];
          // Call fetchPlaces with the default location
          fetchPlaces(defaultLat, defaultLon);
        }
      );
    } else {
      // Handle a scenario where geolocation is not supported by the user's browser.
      // Display an error message indicating that geolocation is not supported.
      console.error("Geolocation is not supported by this browser.");
      view.center = [defaultLon, defaultLat];
      // Call fetchPlaces with the default location
      fetchPlaces(defaultLat, defaultLon);
    }
  }

  const toggleMenuButton = document.getElementById("toggleMenu");
  const selectionMenu = document.getElementById("selectionMenu");

  document.getElementById("toggleMenu").addEventListener("click", function () {
    document.body.classList.toggle("collapsed");
  });

  view.when(function () {
    // Hide the loading overlay
    document.getElementById("loadingOverlay").style.display = "none";
  });

  // retrieves the user's geolocation and displays nearby restaurants on a map
  locationAndPlaces();
});
