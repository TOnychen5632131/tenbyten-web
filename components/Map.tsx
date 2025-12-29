"use client";

import React from "react";
import {
  Map as BaseMap,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, MapPin, Navigation, Star } from "lucide-react";

type Pin = {
  id: string | number;
  lat: number;
  lng: number;
  type: "MARKET" | "CONSIGNMENT" | string;
  title: string;
  address?: string | null;
  images?: string[] | null;
  rating?: number | null;
  ratingCount?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  recurringPattern?: string | null;
  businessHours?: Record<string, string> | string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  website?: string | null;
  applicationLink?: string | null;
};

interface MapProps {
  pins: Pin[];
  filterType: "MARKET" | "CONSIGNMENT";
  onSelect: (id: string | number) => void;
}

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const formatTime = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const formatTimeRange = (start?: string | null, end?: string | null) => {
  const startValue = formatTime(start);
  const endValue = formatTime(end);
  if (startValue && endValue) return `${startValue} - ${endValue}`;
  return startValue || endValue;
};

const normalizeBusinessHours = (
  value?: Record<string, string> | string | null
) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, string>;
      }
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value;
  return null;
};

const getHoursLabel = (pin: Pin) => {
  const timeRange = formatTimeRange(pin.startTime, pin.endTime);
  const scheduleLabel = [pin.recurringPattern, timeRange]
    .filter(Boolean)
    .join(" · ");
  if (scheduleLabel) return scheduleLabel;

  const businessHours = normalizeBusinessHours(pin.businessHours);
  if (businessHours) {
    const todayKey = dayKeys[new Date().getDay()];
    const todayHours = businessHours[todayKey];
    if (typeof todayHours === "string" && todayHours.trim()) {
      return todayHours.replace("-", " - ");
    }
  }

  return "Hours vary";
};

const buildDirectionsUrl = (address?: string | null) => {
  if (!address) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
};

const openExternal = (url?: string | null) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const Map = ({ pins, filterType, onSelect }: MapProps) => {
  const [userLocation, setUserLocation] = React.useState<
    { latitude: number; longitude: number } | null
  >(null);

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location: ", error);
        }
      );
    }
  }, []);

  const visiblePins = React.useMemo(
    () => pins.filter((pin) => pin.type === filterType),
    [pins, filterType]
  );

  return (
    <div className="h-full w-full">
      <BaseMap
        center={[-122.3321, 47.6062]}
        zoom={9}
        scrollZoom
        attributionControl
      >
        <MapControls position="bottom-right" className="bottom-12" showZoom />

        {userLocation && (
          <MapMarker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
          >
            <MarkerContent>
              <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            </MarkerContent>
            <MarkerPopup className="map-popup p-3">
              <div className="text-sm font-semibold">Your location</div>
            </MarkerPopup>
          </MapMarker>
        )}

        {visiblePins.map((pin) => {
          const colorClass =
            pin.type === "MARKET" ? "text-blue-500" : "text-emerald-500";
          const typeLabel =
            pin.type === "MARKET"
              ? "Market"
              : pin.type === "CONSIGNMENT"
                ? "Shop"
                : pin.type;
          const categoryLabel =
            pin.categories?.[0] || pin.tags?.[0] || typeLabel;
          const imageUrl = pin.images?.[0] || null;
          const hoursLabel = getHoursLabel(pin);
          const ratingValue =
            typeof pin.rating === "number" ? pin.rating : null;
          const ratingCount =
            typeof pin.ratingCount === "number" ? pin.ratingCount : null;
          const directionsUrl = buildDirectionsUrl(pin.address);
          const websiteUrl = pin.website || pin.applicationLink || null;
          const hasRating = typeof ratingValue === "number" && ratingValue > 0;

          return (
            <MapMarker key={pin.id} longitude={pin.lng} latitude={pin.lat}>
              <MarkerContent>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-110 ${colorClass}`}
                >
                  <MapPin size={20} fill="currentColor" />
                </div>
                <MarkerLabel position="bottom">{typeLabel}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="map-popup w-72 p-0 border-none">
                <div className="relative w-full overflow-hidden">
                  {imageUrl && (
                    <div className="h-32 w-full">
                      <img
                        src={imageUrl}
                        alt={pin.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {categoryLabel}
                    </span>
                    <h3 className="text-sm font-semibold leading-tight text-foreground">
                      {pin.title}
                    </h3>
                    {pin.address && (
                      <p className="text-xs text-muted-foreground">
                        {pin.address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Star
                      className={`h-3.5 w-3.5 ${hasRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/30"
                        }`}
                    />
                    <span className="font-medium text-foreground">
                      {hasRating ? ratingValue.toFixed(1) : "--"}
                    </span>
                    <span className="text-muted-foreground">
                      ({ratingCount ? ratingCount.toLocaleString() : "0"})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{hoursLabel}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => openExternal(directionsUrl)}
                      disabled={!directionsUrl}
                    >
                      <Navigation className="mr-1.5 h-3.5 w-3.5" />
                      Directions
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => onSelect(pin.id)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </BaseMap>
    </div>
  );
};

export default Map;
