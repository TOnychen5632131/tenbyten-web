'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { divIcon } from 'leaflet';
import React from 'react';
import { MapPin } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

const LocationController = () => {
    const map = useMap();

    React.useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    map.flyTo([latitude, longitude], 13);
                },
                (error) => {
                    console.error("Error getting location: ", error);
                }
            );
        }
    }, [map]);

    return null;
};

interface MapProps {
    pins: Array<{
        id: number;
        lat: number;
        lng: number;
        type: string;
        title: string;
    }>;
    filterType: string;
}

const Map = ({ pins, filterType }: MapProps) => {
    // Custom icon generator
    const createCustomIcon = (type: string) => {
        const colorClass = type === 'MARKET' ? 'text-blue-500' : 'text-emerald-500';

        // Render lucide icon to string
        const iconHtml = ReactDOMServer.renderToString(
            <div className={`p-2 rounded-full shadow-xl bg-white ${colorClass} transform hover:scale-110 transition-transform`}>
                <MapPin size={24} fill="currentColor" />
            </div>
        );

        return divIcon({
            html: iconHtml,
            className: 'custom-marker-icon', // Remove default leaflet styles
            iconSize: [40, 40],
            iconAnchor: [20, 20], // Center the icon
        });
    };

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />
            <LocationController />

            {pins.map((pin) => (
                pin.type === filterType && (
                    <Marker
                        key={pin.id}
                        position={[pin.lat, pin.lng]}
                        icon={createCustomIcon(pin.type)}
                    >
                        <Popup className="custom-popup">
                            <div className="font-bold text-sm">{pin.title}</div>
                            <div className="text-xs opacity-70">{pin.type}</div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
};

export default Map;
