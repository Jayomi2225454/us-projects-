import React, { useMemo, useEffect } from 'react';
import { X, Navigation, Info, Clock, MapPin, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { WasteReport } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapModalProps {
  report: WasteReport;
  cleanerLocation: { lat: number, lng: number } | null;
  onClose: () => void;
}

// Component to handle map view changes
function MapController({ cleanerLoc, destLoc }: { cleanerLoc: { lat: number, lng: number } | null, destLoc: { lat: number, lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (cleanerLoc) {
      const bounds = L.latLngBounds([
        [cleanerLoc.lat, cleanerLoc.lng],
        [destLoc.lat, destLoc.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.setView([destLoc.lat, destLoc.lng], 15);
    }
  }, [map, cleanerLoc, destLoc]);

  return null;
}

// Helper to calculate distance in KM
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

export const MapModal: React.FC<MapModalProps> = ({ report, cleanerLocation, onClose }) => {
  const destination = {
    lat: report.latitude || 23.0225,
    lng: report.longitude || 72.5714
  };

  const distance = useMemo(() => {
    if (!cleanerLocation) return 0;
    return calculateDistance(cleanerLocation.lat, cleanerLocation.lng, destination.lat, destination.lng);
  }, [cleanerLocation, destination]);

  const estTime = Math.round(distance * 5) || 5; // Rough estimate: 5 mins per km in city traffic, min 5 mins

  const handleStartNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${cleanerLocation?.lat},${cleanerLocation?.lng}&destination=${destination.lat},${destination.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[750px] border border-white/20"
      >
        {/* Map Area */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          <MapContainer 
            center={[destination.lat, destination.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapController cleanerLoc={cleanerLocation} destLoc={destination} />

            {cleanerLocation && (
              <Marker position={[cleanerLocation.lat, cleanerLocation.lng]}>
                <Popup>Your Location (Cleaner)</Popup>
              </Marker>
            )}

            <Marker position={[destination.lat, destination.lng]}>
              <Popup>Waste Report Location</Popup>
            </Marker>

            {cleanerLocation && (
              <Polyline 
                positions={[
                  [cleanerLocation.lat, cleanerLocation.lng],
                  [destination.lat, destination.lng]
                ]} 
                color="#000080" 
                weight={4}
                dashArray="10, 10"
                opacity={0.6}
              />
            )}
          </MapContainer>

          {/* Map Overlays */}
          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-[#000080]/10 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#138808] rounded-full animate-pulse"></div>
              <span className="text-[#000080] font-bold text-xs">Live GPS Tracking Active</span>
            </div>
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-[#000080]/10 flex items-center gap-2">
              <Info size={14} className="text-[#000080]" />
              <span className="text-[#000080] font-bold text-xs">Unit I: A* Heuristic Optimization</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-[1000] flex justify-between items-end">
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-gray-100 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Trash2 size={20} className="text-[#FF9933]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Destination</p>
                  <p className="font-bold text-gray-800 text-base truncate">{report.location}</p>
                </div>
              </div>
              <div className="flex gap-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Distance</p>
                  <p className="font-bold text-gray-800">{distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Est. Time</p>
                  <p className="font-bold text-gray-800">{estTime} mins</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleStartNavigation}
              className="bg-[#138808] text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3 hover:shadow-2xl hover:scale-105 transition-all shadow-lg"
            >
              <Navigation size={20} />
              Start Navigation
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-96 bg-white border-l border-gray-100 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold text-[#000080]">Smart Route</h3>
              <p className="text-xs text-gray-400 font-medium">SafaiSetu IIS Engine v2.0</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8 flex-1">
            <div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Navigation size={48} className="text-blue-900" />
              </div>
              <p className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-widest">Unit I: Informed Search</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                A* Search Algorithm used to find the shortest path while avoiding traffic congestion in Ahmedabad.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Clock size={16} className="text-gray-400 mb-2" />
                <p className="text-[10px] text-gray-400 uppercase font-bold">Est. Time</p>
                <p className="text-xl font-bold text-gray-800">{estTime} mins</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Navigation size={16} className="text-gray-400 mb-2" />
                <p className="text-[10px] text-gray-400 uppercase font-bold">Distance</p>
                <p className="text-xl font-bold text-gray-800">{distance.toFixed(1)} km</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route Summary</p>
              <div className="space-y-0 relative">
                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-100"></div>
                
                <div className="flex items-start gap-4 pb-8 relative">
                  <div className="w-10 h-10 rounded-full bg-[#138808] flex items-center justify-center border-4 border-white shadow-md z-10">
                    <MapPin size={14} className="text-white" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Origin</p>
                    <p className="text-sm font-bold text-gray-800">Your Current Location</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">GPS: {cleanerLocation?.lat.toFixed(4)}, {cleanerLocation?.lng.toFixed(4)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-[#FF9933] flex items-center justify-center border-4 border-white shadow-md z-10">
                    <Trash2 size={14} className="text-white" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Destination</p>
                    <p className="text-sm font-bold text-gray-800">{report.type} Waste Site</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">GPS: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">
                SafaiSetu Intelligent Systems
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
