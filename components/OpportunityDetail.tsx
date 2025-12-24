'use client';
import React from 'react';
import { X, Calendar, MapPin, ExternalLink, User, Users, ChevronLeft, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

interface OpportunityDetailProps {
    data: any;
    onClose: () => void;
}

const OpportunityDetail = ({ data, onClose }: OpportunityDetailProps) => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Card Container */}
            <div className="relative w-full max-w-md h-[90vh] md:h-auto md:max-h-[85vh] bg-[#1e1e1e]/60 backdrop-blur-[50px] border border-white/10 rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl animate-slide-up flex flex-col">

                {/* Back Button - Inside Card */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/20 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24 pt-16 md:pt-6">

                    {/* Header: Title & Counter */}
                    <div className="flex justify-between items-start mb-6 pt-2">
                        <div className="flex-1 pr-4">
                            {/* In reference, there is a square image on left, but we can do text if no image */}
                            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
                                {data.title}
                            </h2>
                            <p className="text-white/60 text-sm mt-1 uppercase tracking-wider font-medium">
                                {data.type === 'MARKET' ? 'Offline Event' : 'Consignment Shop'}
                            </p>
                        </div>
                        {/* Circular Counter (Mock) */}
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg">
                            <div className="text-center leading-none">
                                <span className="block text-black font-bold text-sm">24</span>
                                <span className="block text-black/40 text-[10px] font-medium">/ 50</span>
                            </div>
                        </div>
                    </div>

                    {/* Date/Time Strip */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] text-white/60 uppercase font-bold">DEC</span>
                            <span className="text-lg text-white font-bold">20</span>
                        </div>
                        <div>
                            <div className="text-white font-medium text-sm">Sunday, December 2024</div>
                            <div className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                                <Calendar size={12} />
                                7.30am - 9am
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-2 flex gap-3 mb-6">
                        {/* Mini Map Preview */}
                        <div className="w-24 h-24 rounded-2xl bg-gray-700 relative overflow-hidden shrink-0">
                            {/* Mock Map Image Style */}
                            <div className="absolute inset-0 opacity-50 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/0,0,10,0/300x300?access_token=mock')] bg-cover bg-center"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin size={24} className="text-white drop-shadow-md" fill="currentColor" />
                            </div>
                        </div>
                        <div className="flex-1 py-1 pr-2 flex flex-col justify-center">
                            <div className="text-white text-sm font-medium leading-tight mb-2">
                                {data.address || "4517 Washington Ave, Manchester"}
                            </div>
                            <button className="self-start flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
                                <ExternalLink size={12} />
                                Get Direction
                            </button>
                        </div>
                    </div>

                    {/* Hosted By & People Going */}
                    <div className="space-y-3 mb-8">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                            <span className="text-white/60 text-sm pl-1">Hosted By</span>
                            <div className="flex items-center gap-2 bg-black/20 rounded-full pl-1 pr-3 py-1">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <User size={14} className="text-blue-200" />
                                </div>
                                <span className="text-white text-xs font-medium">Mike Wazowki</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                            <span className="text-white/60 text-sm pl-1">People Going <span className="text-white/30 text-xs">(24)</span></span>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#1e1e1e] flex items-center justify-center overflow-hidden">
                                        {/* Mock Avatars */}
                                        <Users size={14} className="text-white/50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* About Event */}
                    <div className="mb-4">
                        <h3 className="text-white font-bold text-lg mb-2">About Event</h3>
                        <p className="text-white/60 text-sm leading-relaxed font-light">
                            {data.description || "Unlock Your Potential On The Court With Our Basketball Offline Class! Designed For Players Of All Skill Levels, This Hands-On Class Will Help You Sharpen Your Fundamentals."}
                        </p>
                    </div>

                    {/* Market Analysis / Professional Report */}
                    <div className="mb-24 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 relative overflow-hidden group">
                        {/* Decorative Background Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="text-blue-400" size={20} />
                            <h3 className="text-white font-bold text-lg">Market Insight</h3>
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto">VERIFIED</span>
                        </div>

                        {/* Score Cards */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-blue-400 font-bold text-xl">9.2</div>
                                <div className="text-white/40 text-[10px] uppercase font-medium">Traffic</div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-emerald-400 font-bold text-xl">8.8</div>
                                <div className="text-white/40 text-[10px] uppercase font-medium">Vendor ROI</div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-purple-400 font-bold text-xl">High</div>
                                <div className="text-white/40 text-[10px] uppercase font-medium">Safety</div>
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <TrendingUp size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-white/70 text-sm leading-relaxed">
                                    <span className="text-white font-medium">Strong Growth Potential.</span> This location has seen a 15% increase in foot traffic over the last month. Highly recommended for vintage and handmade goods.
                                </p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                                <p className="text-white/70 text-sm leading-relaxed">
                                    <span className="text-white font-medium">Competitive Pricing.</span> Booth fees are 10% lower than the area average, offering excellent value for new vendors.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1e1e1e] via-[#1e1e1e] to-transparent pointer-events-none flex justify-center pb-8 md:pb-6">
                    <button className="pointer-events-auto w-full bg-white text-black font-bold text-lg py-4 rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <ExternalLink size={20} />
                        {data.type === 'MARKET' ? 'Apply for Booth' : 'Contact Shop'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityDetail;
