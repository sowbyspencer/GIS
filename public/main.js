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

  /* Holds the URL endpoint for the ServiceArea_World ArcGIS REST service, used to calculate 
  service areas from locations using the ArcGIS API. */
  const url =
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";
  let travelMode = null;

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

  var lastClickedLocation = null;

  view.on("click", (event) => {
    view.hitTest(event).then((response) => {
      const graphic = response.results.find(result => result.graphic.layer === graphicsLayer)?.graphic;
      if (!graphic) {
        // Update the overlay only if a marker was not clicked
        lastClickedLocation = event.mapPoint;
        createServiceAreas(event.mapPoint);
      }
    });
  });

  
  /* The above JavaScript code is adding an event listener to a form with the
  class "inputForm". When a keypress event occurs within the form, the code
  iterates over all input elements within the form and adds a keydown event
  listener to each input. */
  document.querySelector(".inputForm").addEventListener("keypress", function () {
      var form = document.querySelector(".inputForm");
      var inputs = form.querySelectorAll("input");

      inputs.forEach(function (input, index) {
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault(); // Prevent the form from submitting
            var nextInput = inputs[index + 1];
            if (nextInput) {
              nextInput.focus(); // Set focus to the next input
            } else {
              form.querySelector('input[type="button"]').click(); // If there is no next input, click the Calculate button
            }
          }
        });
      });
    });

  /* The above code is adding an event listener to a button element of type
  "button". When the button is clicked, it checks if a variable
  `lastClickedLocation` is defined. If it is, it calls the function
  `createServiceAreas` with the `lastClickedLocation` as an argument. If
  `lastClickedLocation` is not defined, it gets the center point of a view
  (which is assumed to be a map view) and calls the `createServiceAreas`
  function with that point as an argument. */
  document.querySelector('input[type="button"]').addEventListener("click", function () {
      if (lastClickedLocation) {
        createServiceAreas(lastClickedLocation);
      } else {
        var clickedPoint = view.center; // Example, you can modify this to use the actual clicked point
        createServiceAreas(clickedPoint);
      }
    });

  /* The above JavaScript code is adding an event listener to an element with the
  id "toggleMenu". When this element is clicked, the code toggles the
  "collapsed" class on the body element. This means that each time the element
  with id "toggleMenu" is clicked, the "collapsed" class will be added if it's
  not already present, or removed if it is already present. */
  document.getElementById("toggleMenu").addEventListener("click", function () {
      document.body.classList.toggle("collapsed");
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

    // Create the location graphic for the service area
    const locationGraphic = createGraphic(point);
    findServiceArea(locationGraphic);

    // Fetch and display markers for the new location
    fetchPlaces(point.latitude, point.longitude);
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
    document.getElementById("loadingOverlay").innerHTML =
      '<div id="loadingSpinner"></div>Calculating Overlay..';
    document.getElementById("loadingOverlay").style.display = "flex";

    // Read values from the form inputs
    var distanceTimeValue = document.getElementById("distance/time").value;
    var areaType = document.querySelector(
      'input[name="areaType"]:checked'
    ).value;
    var travelModeInput = document.querySelector(
      'input[name="travelMode"]:checked'
    ).value;
    var travelDirectionInput = document.querySelector(
      'input[name="travelDirection"]:checked'
    ).value;

    // Set the defaultBreaks based on the area type (distance or time)
    var defaultBreaks = [parseFloat(distanceTimeValue)]; // Use the same value for both distance and time

    // Combine the area type and travel mode input to create the travel mode string
    var travelModeString = `${travelModeInput} ${areaType}`; // e.g., "Driving Time" or "Walking Distance"

    // Set the travelDirection based on the input
    var travelDirection =
      travelDirectionInput === "From Location"
        ? "from-facility"
        : "to-facility";

    const networkDescription = await networkService.fetchServiceDescription(
      url
    );
    travelMode = networkDescription.supportedTravelModes.find(
      (travelMode) => travelMode.name === travelModeString
    );

    // Calculate and display the service area for a given location feature on a map.
    const serviceAreaParameters = new ServiceAreaParameters({
      facilities: new FeatureSet({
        features: [locationFeature],
      }),
      defaultBreaks: defaultBreaks,
      travelMode,
      travelDirection: travelDirection,
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
    // Clear existing markers from the graphics layer
    graphicsLayer.removeAll();

    var service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    var location = new google.maps.LatLng(lat, lon);
    /* The above JavaScript code is creating an object named `request` with the
    following properties:
    - `location`: This property is assigned the value of the `location`
    variable.
    - `radius`: This property is assigned the string value `"5000"`.
    - `type`: This property is an array that is currently empty, but it is
    commented out. There is a commented-out alternative assignment that
    includes various types such as 'restaurant', 'hospital', 'store', etc. */
    var request = {
      location: location,
      radius: "5000",
      type: ['restaurant']
      // type: ['restaurant', 'hospital', 'store', 'bank', 'museum', 'church', 'atm', 'gas_station', 'library', 'zoo', 'airport', 'gym', 'movie_theater', 'school', 'park']
    };

    service.nearbySearch(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(function (place) {
          var point = {
            type: "point",
            longitude: place.geometry.location.lng(),
            latitude: place.geometry.location.lat(),
          };

          var typeColorMapping = {
            hospital: [255, 0, 0], // Red
            store: [0, 255, 0], // Green
            // food: [0, 0, 255], // Blue
            museum: [255, 255, 0], // Yellow
            church: [255, 0, 255], // Magenta
            // Add more mappings as needed
          };

          // Get the color for the first type of the place or default to orange
          var markerColor = [226, 119, 40]; // Default to orange
          for (var i = 0; i < place.types.length; i++) {
            if (typeColorMapping[place.types[i]]) {
              markerColor = typeColorMapping[place.types[i]];
              break;
            }
          }

          var markerSymbol = {
            type: "simple-marker",
            color: markerColor,
            outline: {
              color: [255, 255, 255], // White
              width: 1,
            },
          };

          var attributes = {
            icon: place.icon,
            name: place.name,
            image: place.photos && place.photos.length > 0 ? place.photos[0].getUrl() : 'path/to/default/image.jpg',
            address: place.vicinity,
            rating: place.rating,
          };

          var popupTemplate = {
            title: "<img src='{icon}' height='20' width='20'> {name}",
            content: "<img src='{image}' style='max-width:100%; max-height:175px; object-fit:contain;'><br>Address: {address}<br>Rating: {rating}"
          };

          var markerGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            attributes: attributes,
            popupTemplate: popupTemplate,
          });

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
          lastClickedLocation = view.center;
        },

        // Callback function handling errors when attempting to retrieve the user's geolocation.
        // Displays an error message indicating that geolocation is not available or permission is denied.
        function (error) {
          console.error("Error getting user location: ", error);
          view.center = [defaultLon, defaultLat];
        }
      );
    } else {
      // Handle a scenario where geolocation is not supported by the user's browser.
      // Display an error message indicating that geolocation is not supported.
      console.error("Geolocation is not supported by this browser.");
      view.center = [defaultLon, defaultLat];
    }
  }

  view.when(function () {
  });

  // retrieves the user's geolocation and displays nearby restaurants on a map
  locationAndPlaces();
});
