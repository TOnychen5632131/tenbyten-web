'use client';
import React, { useState } from 'react';
import MapDateSelector from './MapDateSelector';
import MapFilterToggle from './MapFilterToggle';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#1a1a1a] animate-pulse" />
});

const MapContainer = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterType, setFilterType] = useState<'MARKET' | 'CONSIGNMENT'>('MARKET');

    // Mock data for pins with real Lat/Lng (London area)
    const MOCK_PINS = [
        { id: 1, lat: 51.505, lng: -0.09, type: 'MARKET', title: 'Sunday Farmers Market' },
        { id: 2, lat: 51.515, lng: -0.1, type: 'CONSIGNMENT', title: 'Vintage Vault' },
        { id: 3, lat: 51.525, lng: -0.08, type: 'MARKET', title: 'Art & Craft Fair' },
        { id: 4, lat: 51.500, lng: -0.12, type: 'CONSIGNMENT', title: 'Retro Threads' },
    ];

    return (
        <div className="relative w-full h-[100dvh] bg-[#1a1a1a] flex flex-col pt-32">
            {/* Map visual placeholder */}
            <div className="absolute inset-0 z-0">
                <MapWithNoSSR pins={MOCK_PINS} filterType={filterType} />
            </div>

            {/* Controls Overlay */}
            <div className="relative z-10 flex flex-col gap-4">
                {/* 1. Date Selector (Top Priority) */}
                <div className="flex justify-center pb-2 pt-4">
                    <MapDateSelector onDateSelect={setSelectedDate} />
                </div>

                {/* 2. Type Filter */}
                <div className="px-4">
                    <MapFilterToggle type={filterType} onChange={setFilterType} />
                </div>
            </div>

            {/* Bottom Sheet Placeholder for specific location details */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                <div className="text-white/40 text-center text-sm">
                    Select a date and location to view details
                </div>
            </div>
        </div>
    );
};

export default MapContainer;
