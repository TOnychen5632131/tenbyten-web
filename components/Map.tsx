'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { divIcon } from 'leaflet';
import React from 'react';
import { MapPin } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

interface LocationControllerProps {
    onLocation: (coords: [number, number]) => void;
}

const LocationController = ({ onLocation }: LocationControllerProps) => {
    React.useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    onLocation([latitude, longitude]);
                },
                (error) => {
                    console.error("Error getting location: ", error);
                }
            );
        }
    }, [onLocation]);

    return null;
};

interface MapProps {
    pins: Array<{
        id: string | number;
        lat: number;
        lng: number;
        type: 'MARKET' | 'CONSIGNMENT' | string;
        title: string;
    }>;
    filterType: 'MARKET' | 'CONSIGNMENT';
    onSelect: (id: string | number) => void;
}

const Map = ({ pins, filterType, onSelect }: MapProps) => {
    const [userLocation, setUserLocation] = React.useState<[number, number] | null>(null);

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

    const createUserLocationIcon = () => {
        return divIcon({
            html: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.6);"></div>',
            className: 'user-location-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
        });
    };

    const [mapKey] = React.useState(() => `map-${Date.now()}`);

    return (
        <MapContainer
            key={mapKey}
            center={[47.6062, -122.3321]}
            zoom={9}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />
            <LocationController onLocation={setUserLocation} />

            {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon()}>
                    <Popup className="custom-popup">
                        <div className="font-bold text-sm">Your location</div>
                    </Popup>
                </Marker>
            )}

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
                            <button
                                type="button"
                                onClick={() => onSelect(pin.id)}
                                className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/20"
                            >
                                View details
                            </button>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
};

export default Map;
