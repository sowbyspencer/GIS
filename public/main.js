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
    .then((response) => response.text())
    .then((apiKey) => {
      esriConfig.apiKey = apiKey.trim(); // Trim whitespace

      // Call initializeMap after fetching the API key
      initializeMap();
    })
    .catch((error) => {
      console.error("Error fetching API Key:", error);
    });

  // Map initialization logic wrapped in a function
  function initializeMap() {
    const map = new Map({
      basemap: "arcgis-navigation",
    });

    const view = new MapView({
      container: "viewDiv",
      map,
      center: [-117.133163, 34.022445],
      zoom: 10,
      constraints: {
        snapToZoom: false,
      },
    });

    const url =
      "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
    view.ui.add(new ScaleBar({ view, style: "line" }), "bottom-right");

    // Add event handlers and utilities as needed
    console.log("Map and View Initialized");

    // Utility Functions
    function getClientLocation() {
      var defaultLat = 65;
      var defaultLon = 15;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            view.center = [position.coords.longitude, position.coords.latitude];
            lastClickedLocation = view.center;
          },
          function (error) {
            console.error("Error getting user location: ", error);
            view.center = [defaultLon, defaultLat];
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        view.center = [defaultLon, defaultLat];
      }
    }

    function createGraphic(geometry) {
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
      document.getElementById("loadingOverlay").innerHTML =
        '<div id="loadingSpinner"></div>Calculating Overlay..';
      document.getElementById("loadingOverlay").style.display = "flex";

      const distanceTimeValue = parseFloat(
        document.getElementById("distance/time").value
      );
      const areaType = document.querySelector(
        'input[name="areaType"]:checked'
      ).value;
      const travelModeInput = document.querySelector(
        'input[name="travelMode"]:checked'
      ).value;
      const travelDirectionInput = document.querySelector(
        'input[name="travelDirection"]:checked'
      ).value;

      const travelModeString = `${travelModeInput} ${areaType}`;
      const travelDirection =
        travelDirectionInput === "From Location"
          ? "from-facility"
          : "to-facility";

      const networkDescription = await networkService.fetchServiceDescription(
        url
      );
      travelMode = networkDescription.supportedTravelModes.find(
        (mode) => mode.name === travelModeString
      );

      const isIncrementEnabled =
        document.getElementById("incrementToggle").checked;

      if (isIncrementEnabled) {
        const fullIncrements = Math.floor(distanceTimeValue / 15) * 15;
        const remainder = distanceTimeValue % 15;

        for (let i = 15; i <= fullIncrements; i += 15) {
          await calculateAndDisplayOverlay(locationFeature, i);
        }

        if (remainder > 0 || fullIncrements === 0) {
          await calculateAndDisplayOverlay(
            locationFeature,
            fullIncrements + remainder
          );
        }
      } else {
        await calculateAndDisplayOverlay(locationFeature, distanceTimeValue);
      }

      document.getElementById("loadingOverlay").style.display = "none";
    }

    async function calculateAndDisplayOverlay(locationFeature, breakValue) {
      const travelDirectionInput = document.querySelector(
        'input[name="travelDirection"]:checked'
      ).value;

      const travelDirection =
        travelDirectionInput === "From Location"
          ? "from-facility"
          : "to-facility";

      const serviceAreaParameters = new ServiceAreaParameters({
        facilities: new FeatureSet({ features: [locationFeature] }),
        defaultBreaks: [breakValue],
        travelMode,
        travelDirection,
        outSpatialReference: view.spatialReference,
        trimOuterPolygon: true,
      });

      try {
        const { serviceAreaPolygons } = await serviceArea.solve(
          url,
          serviceAreaParameters
        );
        showServiceAreas(serviceAreaPolygons, breakValue);
      } catch (error) {
        console.error(`Error solving service area for ${breakValue}: `, error);
      }
    }

    function showServiceAreas(serviceAreaPolygons, breakValue) {
      const selectedStyle = document.getElementById("overlayStyle").value;

      const graphics = serviceAreaPolygons.features.map((g) => {
        g.symbol = {
          type: "simple-fill",
          style: selectedStyle,
          color: "rgba(255, 0, 0, 0.1)",
          outline: {
            color: "black",
            width: 1,
          },
        };
        return g;
      });
      view.graphics.addMany(graphics, 0);
    }

    view.when(() => {
      createServiceAreas(view.center);
    });

    var lastClickedLocation = null;

    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const graphic = response.results.find(
          (result) => result.graphic.layer === graphicsLayer
        )?.graphic;
        if (!graphic) {
          lastClickedLocation = event.mapPoint;
          createServiceAreas(event.mapPoint);
        }
      });
    });

    document
      .querySelector(".inputForm")
      .addEventListener("keypress", function () {
        var form = document.querySelector(".inputForm");
        var inputs = form.querySelectorAll("input");

        inputs.forEach(function (input, index) {
          input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
              event.preventDefault();
              var nextInput = inputs[index + 1];
              if (nextInput) {
                nextInput.focus();
              } else {
                form.querySelector('input[type="button"]').click();
              }
            }
          });
        });
      });

    document
      .querySelector('input[type="button"]')
      .addEventListener("click", function () {
        if (lastClickedLocation) {
          createServiceAreas(lastClickedLocation);
        } else {
          var clickedPoint = view.center;
          createServiceAreas(clickedPoint);
        }
      });

    document
      .getElementById("toggleMenu")
      .addEventListener("click", function () {
        document.body.classList.toggle("collapsed");
      });

    function createServiceAreas(point) {
      view.graphics.removeAll();
      const locationGraphic = createGraphic(point);
      findServiceArea(locationGraphic);
    }

    getClientLocation();
  }
});
