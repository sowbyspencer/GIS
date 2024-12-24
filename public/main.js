// Purpose: This file contains the logic for the ArcGIS API for JavaScript application.
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
  // Fetch the API key dynamically
  fetch("/api-key")
    .then((response) => response.text()) // Parse the response as text
    .then((apiKey) => {
      // Pass the API key to the next .then block
      esriConfig.apiKey = apiKey.trim(); // Trim whitespace

      // Call initializeMap after fetching the API key
      initializeMap();
    })
    .catch((error) => {
      // Log an error if the API key is not fetched
      console.error("Error fetching API Key:", error);
    });

  // Map initialization logic wrapped in a function
  function initializeMap() {
    // Create a Map instance (passing in the basemap type)
    const map = new Map({
      basemap: "arcgis-navigation",
    });

    // Create a MapView instance (passing in the map and a div container)
    const view = new MapView({
      container: "viewDiv",
      map,
      center: [-117.133163, 34.022445],
      zoom: 10,
      constraints: {
        snapToZoom: false,
      },
    });

    // The url is to say what type of service area we want to calculate
    const url =
      "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";

    // Initialize the travel mode
    const graphicsLayer = new GraphicsLayer();
    // Add the graphics layer to the map
    map.add(graphicsLayer);
    // Add the scale bar widget to the view
    view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");

    // Add event handlers and utilities as needed
    console.log("Map and View Initialized");

    // Utility Functions
    /**
     * Get the user's location
     */
    function getClientLocation() {
      // Default latitude and longitude
      var defaultLat = 65;
      // Default latitude and longitude
      var defaultLon = 15;

      // Check if geolocation is supported
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            // If the user location is found
            view.center = [position.coords.longitude, position.coords.latitude];
            // Set the last clicked location
            lastClickedLocation = view.center;
          },
          function (error) {
            // If there is an error getting the user location
            console.error("Error getting user location: ", error);
            // Set the default location
            view.center = [defaultLon, defaultLat];
          }
        );
      } else {
        // If geolocation is not supported
        console.error("Geolocation is not supported by this browser.");
        // Set the default location
        view.center = [defaultLon, defaultLat];
      }
    }
    /**
     * Create a graphic at the given location
     * @param geometry represents the location of the service area
     * @returns graphic
     */
    function createGraphic(geometry) {
      const graphic = new Graphic({
        geometry,
        symbol: {
          type: "simple-marker",
          color: "white",
          size: 8,
        },
      });

      // Add the graphic to the graphics layer
      view.graphics.add(graphic);
      return graphic;
    }

    async function findServiceArea(locationFeature) {
      // Clear existing graphics
      document.getElementById("loadingOverlay").innerHTML =
        '<div id="loadingSpinner"></div>Calculating Overlay..';
      // Show the loading overlay
      document.getElementById("loadingOverlay").style.display = "flex";

      // Get the distance/time value input
      const distanceTimeValue = parseFloat(
        document.getElementById("distance/time").value
      );
      // Get the area type input
      const areaType = document.querySelector(
        'input[name="areaType"]:checked'
      ).value;
      // Get the travel mode input
      const travelModeInput = document.querySelector(
        'input[name="travelMode"]:checked'
      ).value;
      // Get the travel direction
      const travelDirectionInput = document.querySelector(
        'input[name="travelDirection"]:checked'
      ).value;

      // Get the travel mode string
      const travelModeString = `${travelModeInput} ${areaType}`;

      // Get the travel direction
      const travelDirection =
        travelDirectionInput === "From Location"
          ? "from-facility"
          : "to-facility";

      // Get the netework description which is used to get the travel mode
      const networkDescription = await networkService.fetchServiceDescription(
        url
      );
      // Get the travel mode
      travelMode = networkDescription.supportedTravelModes.find(
        (mode) => mode.name === travelModeString
      );

      // Get the increment toggle
      const isIncrementEnabled =
        document.getElementById("incrementToggle").checked;

      // If the increment toggle is enabled
      if (isIncrementEnabled) {
        // Calculate the full increments
        const fullIncrements = Math.floor(distanceTimeValue / 15) * 15;
        // Calculate the remainder
        const remainder = distanceTimeValue % 15;

        // Calculate and display the overlay for the first 15 minutes
        for (let i = 15; i <= fullIncrements; i += 15) {
          // Calculate and display the overlay
          await calculateAndDisplayOverlay(locationFeature, i);
        }

        // IF there is a remainder, calculate the overlay for the remainder
        if (remainder > 0 || fullIncrements === 0) {
          await calculateAndDisplayOverlay(
            locationFeature,
            fullIncrements + remainder // Add the remainder to the full increments
          );
        }
      } else {
        // Calculate and display the overlay
        await calculateAndDisplayOverlay(locationFeature, distanceTimeValue);
      }

      // Hide the loading overlay
      document.getElementById("loadingOverlay").style.display = "none";
    }

    /**
     * Calculate and display the overlay for the given location feature and
     * break value (distance or time), travel mode, and travel direction, and
     * add it to the map.
     * @param locationFeature This holds how far the service area should extend from the location.
     * @param breakValue This holds the distance or time value.
     */
    async function calculateAndDisplayOverlay(locationFeature, breakValue) {
      // Get the travel mode
      const travelDirectionInput = document.querySelector(
        'input[name="travelDirection"]:checked'
      ).value;

      // Get the travel mode
      const travelDirection =
        travelDirectionInput === "From Location" // Is the travel direction from the location?
          ? "from-facility" // Yes: "from-facility"
          : "to-facility"; // No: "to-facility"

      // Create service area parameters
      const serviceAreaParameters = new ServiceAreaParameters({
        facilities: new FeatureSet({ features: [locationFeature] }), // Facilities
        defaultBreaks: [breakValue], // Break values
        travelMode, // Travel mode
        travelDirection, // Travel direction
        outSpatialReference: view.spatialReference, // Output spatial reference
        trimOuterPolygon: true, // Trim the outermost polygon
      });

      // Solve the service area
      try {
        const { serviceAreaPolygons } = await serviceArea.solve(
          url, // The service area URL
          serviceAreaParameters // The service area parameters
        );
        // Show the service areas on the map
        showServiceAreas(serviceAreaPolygons, breakValue);
      } catch (error) {
        // Log the error
        console.error(`Error solving service area for ${breakValue}: `, error);
      }
    }

    /**
     * Show the service areas on the map
     * @param serviceAreaPolygons The service area polygons
     * @param breakValue The break value
     */
    function showServiceAreas(serviceAreaPolygons, breakValue) {
      // Get the selected style
      const selectedStyle = document.getElementById("overlayStyle").value;

      // Create graphics for the service areas
      const graphics = serviceAreaPolygons.features.map((g) => {
        g.symbol = {
          type: "simple-fill", // autocasts as new SimpleFillSymbol()
          style: selectedStyle, // Default is solid
          color: "rgba(255, 0, 0, 0.1)", // Default is red
          outline: {
            color: "black", // Default is black
            width: 1, // Default is 1
          },
        };
        return g; // Return the graphic
      });
      // Add the graphics to the graphics layer
      view.graphics.addMany(graphics, 0);
    }

    // Initialize the service areas around the center of the view
    view.when(() => {
      createServiceAreas(view.center);
    });

    // Initialize the last clicked location
    var lastClickedLocation = null;

    // Add a click event listener to the view to create service areas
    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        // Find the graphic that corresponds to the graphics layer
        const graphic = response.results.find(
          (result) => result.graphic.layer === graphicsLayer
        )?.graphic;
        if (!graphic) {
          // Set the last clicked location
          lastClickedLocation = event.mapPoint;
          // Clear existing graphics
          createServiceAreas(event.mapPoint);
        }
      });
    });

    // Add event listeners to the form inputs to handle keyboard navigation
    document
      .querySelector(".inputForm") // Get the form
      .addEventListener("keypress", function () {
        // Add a keypress event listener
        // Get the form
        var form = document.querySelector(".inputForm");
        // Get the inputs
        var inputs = form.querySelectorAll("input");

        inputs.forEach(function (input, index) {
          // Loop through the inputs
          input.addEventListener("keydown", function (event) {
            // Add a keydown event listener
            if (event.key === "Enter") {
              event.preventDefault(); // Prevent the default form submission
              var nextInput = inputs[index + 1]; // Get the next input
              if (nextInput) {
                nextInput.focus(); // Focus the next input
              } else {
                form.querySelector('input[type="button"]').click(); // Click the button
              }
            }
          });
        });
      });

    // Add a click event listener to the button to create service areas
    document
      .querySelector('input[type="button"]') // Get the button
      .addEventListener("click", function () {
        // Add a click event listener
        if (lastClickedLocation) {
          createServiceAreas(lastClickedLocation); // Create service areas around the last clicked location
        } else {
          var clickedPoint = view.center; // Get the center of the view
          createServiceAreas(clickedPoint); // Create service areas around the center of the view
        }
      });

    // Add a a click event listener to the toggle menu button
    document
      .getElementById("toggleMenu") // Get the menu toggle button
      .addEventListener("click", function () {
        // Add a click event listener
        document.body.classList.toggle("collapsed"); // Toggle the collapsed class on the body
      });

    // Create service areas around the clicked location
    function createServiceAreas(point) {
      // Clear existing graphics
      view.graphics.removeAll();

      // Create a graphic at the clicked location
      const locationGraphic = createGraphic(point);

      // Clear existing service areas
      findServiceArea(locationGraphic);
    }

    // Get the user's location
    getClientLocation();
  }
});
