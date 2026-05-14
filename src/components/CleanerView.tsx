import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Route, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { WasteReport, Cleaner } from '../types';
import { MapModal } from './MapModal';

interface CleanerViewProps {
  reports: WasteReport[];
  onComplete: (id: string) => void;
}

export const CleanerView: React.FC<CleanerViewProps> = ({ reports, onComplete }) => {
  const [showMap, setShowMap] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [cleanerLocation, setCleanerLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCleanerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Cleaner geolocation failed:", error);
          // Fallback to Ahmedabad center if denied
          setCleanerLocation({ lat: 23.0225, lng: 72.5714 });
        }
      );
    }
  }, []);

  const activeReports = reports.filter(r => r.status === 'Assigned' || r.status === 'Pending');

  const handleOpenMap = (report: WasteReport) => {
    setSelectedReport(report);
    setShowMap(true);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-[#138808] rounded-full"></span>
            Cleaner Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Manage your active tasks and optimized routes.</p>
        </div>
        <div className="bg-[#138808]/10 px-4 py-2 rounded-full flex items-center gap-2 border border-[#138808]/20">
          <div className="w-2 h-2 bg-[#138808] rounded-full animate-pulse"></div>
          <span className="text-[#138808] font-bold text-sm">Active Duty</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {activeReports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-gray-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-400">No Pending Tasks</h3>
            <p className="text-gray-400 text-sm">All areas are currently clean!</p>
          </div>
        ) : (
          activeReports.map((report) => (
            <motion.div
              layout
              key={report.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="text-[#000080]" size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#FF9933] uppercase tracking-wider">{report.type} Waste</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800">{report.location}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Priority:</span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      report.priority > 7 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {report.priority}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span className="text-xs font-bold text-gray-700">{report.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleOpenMap(report)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FF9933] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#e68a2e] transition-colors"
                >
                  <Route size={18} />
                  Smart Route
                </button>
                <button
                  onClick={() => onComplete(report.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#138808] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#0f6d06] transition-colors"
                >
                  <CheckCircle size={18} />
                  Complete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showMap && selectedReport && (
        <MapModal 
          report={selectedReport} 
          cleanerLocation={cleanerLocation}
          onClose={() => setShowMap(false)} 
        />
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
