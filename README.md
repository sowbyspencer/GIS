# Overview

This project is a web-based GIS application designed to further my learning as a software engineer. The application displays a map using the ArcGIS API for JavaScript and allows users to view markers representing various locations, such as restaurants, parks, and schools, fetched dynamically using the Google Places API. Additionally, the application features interactive isochrone overlays that users can generate by clicking on the map. The overlays are enhanced by user controls that vary the distance, type of travel, and overlay style, providing a more interactive experience with geographical data. The isochrone can now handle custom increments based on user input and visual differentiation through user-selectable styles.

The purpose of this software is to gain hands-on experience with GIS technologies and to understand how to integrate and display geographical data in a web application.

[Software Demo Video](https://youtu.be/BHdvXoBKUr4)

[Try It Out](https://sowbyspencer.github.io/GIS/public/)

- `npm start`

# Development Environment

The development environment for this project includes:

- Visual Studio Code as the IDE
- ArcGIS API for JavaScript for map rendering and GIS functionalities
- HTML, CSS, and JavaScript for front-end development

# Features and Updates

- **Customizable Isochrone Overlays:**
  - Users can input custom increments for overlays (e.g., 15, 30, or 45 minutes/miles).
  - Overlays are dynamically generated based on the user's input.
- **Travel Direction and Mode:**
  - The application supports user-defined travel direction (e.g., "from location" or "to location") and travel modes (e.g., driving or walking).
- **Overlay Styles:**
  - Users can select the style of overlays (e.g., solid, diagonal lines, or crosshatch) from a dropdown menu.

# Useful Websites

- [ArcGIS for Developers](https://developers.arcgis.com/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [smappen](https://www.smappen.com/documentation/draw-an-isochrone/)

# Version History

| Version | Date       | Changes                                                                                                        |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| 0.0.1   |            | Initial release with basic map and overlays.                                                                   |
| 0.0.2   |            | Added Google Places API integration.                                                                           |
| 0.0.3   | 12/23/2024 | Added custom increments, overlay styles, and dynamic travel directions. Removed Google places API and markers. |

# Future Work

Here are some areas for future development:

- Optimize the user interface for a more engaging user experience.
- Integrate additional data sources for a more comprehensive data display.

_Way Later_

- Develop a feature to save and share custom isochrone maps.
- Implement real-time traffic data integration for more accurate travel time calculations.
