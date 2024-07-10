import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from "react-dom/client";
import { APIProvider, Map, MapCameraChangedEvent, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

type Poi = { key: string, location: google.maps.LatLngLiteral, name: string, description: string };
const locations: Poi[] = [
  { key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108 }, name: 'Opera House', description: 'An iconic landmark.' },
  { key: 'tarongaZoo', location: { lat: -33.8472767, lng: 151.2188164 }, name: 'Taronga Zoo', description: 'A popular zoo.' },
  // Add more locations here
];

const App = () => (
  <APIProvider apiKey={'API_KEY'} onLoad={() => console.log('Maps API has loaded.')}>
    <Map
      defaultZoom={13}
      defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
      mapId='MAP_ID'
      onCameraChanged={(ev: MapCameraChangedEvent) =>
        console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
      }>
      <PoiMarkers pois={locations} />
    </Map>
  </APIProvider>
);

const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap();
  const [selected, setSelected] = useState<Poi | null>(null);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const handleClick = useCallback((ev: google.maps.MapMouseEvent, poi: Poi) => {
    if (!map) return;
    if (!ev.latLng) return;

    if (infoWindowRef.current && selected && selected.key === poi.key) {
      // If the same marker is clicked again, close the InfoWindow and deselect the marker
      infoWindowRef.current.close();
      setSelected(null);
      return;
    }

    // Close the currently open InfoWindow if it exists
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    setSelected(null); // Reset selected to null to force update
    setTimeout(() => {
      setSelected(poi);
    }, 0);

    map.panTo(ev.latLng);
  }, [map, selected]);

  // Initialize MarkerClusterer, if the map has changed
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update markers, if the markers array has changed
  useEffect(() => {
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      const markers = props.pois.map(poi => {
        const marker = new google.maps.Marker({
          position: poi.location,
          title: poi.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: selected && selected.key === poi.key ? '#0000FF' : '#FBBC04',
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 2,
            scale: 6,
          },
        });
        marker.addListener('click', (ev) => handleClick(ev, poi));
        return marker;
      });
      clusterer.current.addMarkers(markers);
    }
  }, [props.pois, handleClick, selected]);

  useEffect(() => {
    if (!selected) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -30)  // Adjust the vertical offset as needed
      });
    }

    infoWindowRef.current.setContent(`
      <div>
        <h3>${selected.name}</h3>
        <p>${selected.description}</p>
      </div>
    `);
    infoWindowRef.current.setPosition(selected.location);
    infoWindowRef.current.open(map);

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [selected, map]);

  return null;
};

const root = createRoot(document.getElementById('app'));
root.render(<App />);

export default App;
