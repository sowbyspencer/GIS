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
    // Create service areas around the map view's center
    createServiceAreas(view.center);
  });

  // Store the last clicked location on the map
  var lastClickedLocation = null;

  view.on("click", (event) => {
    // Add a click event listener to the view
    view.hitTest(event).then((response) => {
      // Perform a hitTest on the view
      const graphic = response.results.find(
        // Find the first graphic that meets the following condition
        (result) => result.graphic.layer === graphicsLayer // Check if the graphic is in the graphicsLayer
      )?.graphic; // Check if a graphic was clicked
      if (!graphic) {
        // Update the overlay only if a marker was not clicked
        lastClickedLocation = event.mapPoint; // Store the clicked location
        createServiceAreas(event.mapPoint); // Create service areas around the clicked point
      }
    });
  });

  /* Adding an event listener to a form with the
  class "inputForm". When a keypress event occurs within the form, the code
  iterates over all input elements within the form and adds a keydown event
  listener to each input. */
  document
    .querySelector(".inputForm") // Select the form with the class "inputForm"
    .addEventListener("keypress", function () {
      // Add a keypress event listener
      // Select the form with the class "inputForm"
      var form = document.querySelector(".inputForm");
      // Select all input elements within the form
      var inputs = form.querySelectorAll("input");

      inputs.forEach(function (input, index) {
        // Iterate over each input
        input.addEventListener("keydown", function (event) {
          // Add a keydown event listener to the input
          if (event.key === "Enter") {
            event.preventDefault(); // Prevent the form from submitting
            var nextInput = inputs[index + 1]; // Get the next input
            if (nextInput) {
              nextInput.focus(); // Set focus to the next input
            } else {
              form.querySelector('input[type="button"]').click(); // If there is no next input, click the Calculate button
            }
          }
        });
      });
    });

  /* Add an event listener to the Calculate button to create service areas
   when the button is clicked. If a location has been clicked on the map,
   use that location as the center for the service area calculation. Otherwise,
   use the center of the map view
   */
  document
    .querySelector('input[type="button"]') // Select the Calculate button
    .addEventListener("click", function () {
      // Add a click event listener
      if (lastClickedLocation) {
        // Check if a location has been clicked
        createServiceAreas(lastClickedLocation); // Use the last clicked location
      } else {
        var clickedPoint = view.center; // Use the center of the map view
        createServiceAreas(clickedPoint); // Create service areas around the clicked point
      }
    });

  // Add an event listener to the Clear button to remove all graphics from the map
  document.getElementById("toggleMenu").addEventListener("click", function () {
    // Add a click event listener
    document.body.classList.toggle("collapsed"); // Toggle the collapsed class on the body
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
   * Calculates and displays the service areas for a given location feature in increments.
   * @param locationFeature - The feature that defines the center point for the service area calculation.
   */
  async function findServiceArea(locationFeature) {
    // Show the loading overlay
    document.getElementById("loadingOverlay").innerHTML =
      '<div id="loadingSpinner"></div>Calculating Overlay..';
    document.getElementById("loadingOverlay").style.display = "flex";

    // Read values from the form inputs
    // Read the distance/time value from the user input
    const distanceTimeValue = parseFloat(
      document.getElementById("distance/time").value
    );
    // Read the selected area type from the user input
    const areaType = document.querySelector(
      'input[name="areaType"]:checked'
    ).value;
    // Read the selected travel mode from the user input
    const travelModeInput = document.querySelector(
      'input[name="travelMode"]:checked'
    ).value;
    // Read the selected travel direction from the user input
    const travelDirectionInput = document.querySelector(
      'input[name="travelDirection"]:checked'
    ).value;

    // Combine the area type and travel mode input to create the travel mode string
    const travelModeString = `${travelModeInput} ${areaType}`; // e.g., "Driving Time" or "Walking Distance"
    const travelDirection =
      travelDirectionInput === "From Location"
        ? "from-facility"
        : "to-facility";

    // Fetch the service description for the network service
    const networkDescription = await networkService.fetchServiceDescription(
      url
    );
    // Find the travel mode that matches the user input
    travelMode = networkDescription.supportedTravelModes.find(
      (mode) => mode.name === travelModeString
    );

    // Generate overlays for 15-minute/mile increments
    // Largest multiple of 15 <= user input
    const fullIncrements = Math.floor(distanceTimeValue / 15) * 15;
    // Remaining value if not a perfect multiple of 15
    const remainder = distanceTimeValue % 15;

    // Generate overlays for each full 15-minute/mile increment
    for (let i = 15; i <= fullIncrements; i += 15) {
      await calculateAndDisplayOverlay(locationFeature, i);
    }

    // Add an overlay for the remainder, if applicable
    if (remainder > 0 || fullIncrements === 0) {
      await calculateAndDisplayOverlay(
        locationFeature,
        fullIncrements + remainder
      );
    }

    // Hide the loading overlay when done
    document.getElementById("loadingOverlay").style.display = "none";
  }

  /**
   * Helper function to calculate and display a service area overlay.
   * @param locationFeature - The feature at the center of the service area calculation.
   * @param breakValue - The value for the current service area break.
   */
  async function calculateAndDisplayOverlay(locationFeature, breakValue) {
    // Read the selected travel direction from the user input
    const travelDirectionInput = document.querySelector(
      'input[name="travelDirection"]:checked'
    ).value;

    // Map user input to the corresponding travelDirection for the API
    const travelDirection =
      travelDirectionInput === "From Location"
        ? "from-facility"
        : "to-facility";

    // Create service area parameters
    const serviceAreaParameters = new ServiceAreaParameters({
      facilities: new FeatureSet({ features: [locationFeature] }), // Use the location as the facility
      defaultBreaks: [breakValue], // Use the specified break value
      travelMode, // Use the selected travel mode
      travelDirection, // Use the user-selected travel direction
      outSpatialReference: view.spatialReference, // Use the map's spatial reference
      trimOuterPolygon: true, // Trim the outermost polygon to the break value
    });

    // Calculate the service area for the specified break value
    try {
      // Solve the service area for the specified break value
      const { serviceAreaPolygons } = await serviceArea.solve(
        url,
        serviceAreaParameters
      );
      // Display the service area on the map
      showServiceAreas(serviceAreaPolygons, breakValue);
    } catch (error) {
      console.error(`Error solving service area for ${breakValue}: `, error);
    }
  }

  /**
   * Function `showServiceAreas` adds service area polygons with the style selected by the user.
   * @param serviceAreaPolygons - Object containing features representing polygons that define service areas.
   * @param breakValue - The value for the current service area break.
   */
  function showServiceAreas(serviceAreaPolygons, breakValue) {
    // Get the selected style from the dropdown menu
    const selectedStyle = document.getElementById("overlayStyle").value;

    // Create graphics for each service area polygon
    const graphics = serviceAreaPolygons.features.map((g) => {
      g.symbol = {
        type: "simple-fill", // Fill symbol
        style: selectedStyle, // Use the selected style
        color: "rgba(255, 0, 0, 0.2)", // Red with transparency
        outline: {
          color: "black", // Black outline for all styles
          width: 1, // Thin outline
        },
      };
      return g;
    });
    // Add the service area graphics to the map.
    view.graphics.addMany(graphics, 0);
  }

  /**
   * Function `getClientLocation` retrieves the user's geolocation and sets the
   * map view center to the user's current location.
   */
  function getClientLocation() {
    // Get the user's location or use the default location
    var defaultLat = 65;
    var defaultLon = 15;

    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
      // Get the user's current location
      navigator.geolocation.getCurrentPosition(
        // Callback function executed when the user's geolocation is successfully retrieved.
        function (position) {
          // Set the center of the map view to the user's current location.
          view.center = [position.coords.longitude, position.coords.latitude];

          // Store the last clicked location as the center of the map view.
          lastClickedLocation = view.center;
        },

        // Callback function executed when an error occurs while retrieving the user's geolocation.
        function (error) {
          // Display an error message indicating that geolocation is not available or permission is denied.
          console.error("Error getting user location: ", error);

          // Set the center of the map view to the default location.
          view.center = [defaultLon, defaultLat];
        }
      );
    } else {
      // Display an error message indicating that geolocation is not supported by the browser.
      console.error("Geolocation is not supported by this browser.");

      // Set the center of the map view to the default location.
      view.center = [defaultLon, defaultLat];
    }
  }

  // Wait for the view to be ready before creating service areas
  view.when(function () {});

  // retrieves the user's geolocation and displays nearby restaurants on a map
  getClientLocation();
});
