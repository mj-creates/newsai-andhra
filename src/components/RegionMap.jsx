import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// AP boundaries - locks map to Andhra Pradesh
const AP_CENTER = [15.9129, 79.7400];
const AP_BOUNDS = [
  [12.6, 76.7], // southwest corner
  [19.9, 84.8]  // northeast corner
];

const FlyToDistrict = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.flyTo(coordinates, 9, { duration: 2.0 });
    }
  }, [coordinates, map]);
  return null;
};

const RegionMap = ({ region, theme }) => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (region) {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${region}+Andhra+Pradesh+India&format=json&limit=1`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            setCoordinates([
              parseFloat(data[0].lat),
              parseFloat(data[0].lon),
            ]);
          }
        })
        .catch(err => console.error("Map geocoding error:", err));
    }
  }, [region]);

  // Use Map tiles matching the active theme
  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="card map-panel">
      <div className="map-container">
        <MapContainer
          center={AP_CENTER}
          zoom={7}
          maxBounds={AP_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={6}
          maxZoom={11}
          style={{ height: "320px", width: "100%" }}
          zoomControl={true}
        >
          {/* Key prop forces React to recreate the tile layer when the URL changes */}
          <TileLayer
            key={tileUrl}
            url={tileUrl}
            attribution={attribution}
          />
          {coordinates && <FlyToDistrict coordinates={coordinates} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default RegionMap;