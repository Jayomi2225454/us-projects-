import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Users, Trash2, TrendingUp, Info, MapPin, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WasteReport, Cleaner, WasteType } from '../types';
import { validateAssignment, getBayesianProbability } from '../services/intelligence';
import { cn } from '../lib/utils';

interface AdminViewProps {
  reports: WasteReport[];
  cleaners: Cleaner[];
  onAssign: (reportId: string, cleanerId: string) => void;
  onAddCleaner: (cleaner: Cleaner) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ reports, cleaners, onAssign, onAddCleaner }) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [cspMessage, setCspMessage] = useState<string | null>(null);
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [newCleanerName, setNewCleanerName] = useState("");
  const [newCleanerDept, setNewCleanerDept] = useState<WasteType>("Plastic");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [taskView, setTaskView] = useState<'pending' | 'completed'>('pending');

  const pendingReports = reports.filter(r => r.status === 'Pending');
  const completedReports = reports.filter(r => r.status === 'Completed');
  
  // Group reports by location to identify hotspots
  const hotspots = useMemo(() => {
    const groups: Record<string, WasteReport[]> = {};
    reports.forEach(report => {
      const loc = report.location || "Unknown";
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(report);
    });

    return Object.entries(groups).map(([location, areaReports], index) => {
      const firstReport = areaReports[0];
      // Map coordinates to percentage for visualization on the mock map
      // Ahmedabad approx: Lat 23.0225, Lon 72.5714
      // We'll use a simple mapping for visualization
      const top = firstReport.latitude 
        ? `${Math.min(90, Math.max(10, ((23.1 - firstReport.latitude) / 0.2) * 100))}%` 
        : `${(index * 23) % 70 + 15}%`;
      const left = firstReport.longitude 
        ? `${Math.min(90, Math.max(10, ((firstReport.longitude - 72.4) / 0.3) * 100))}%` 
        : `${(index * 31) % 70 + 15}%`;
      
      const areaName = location.includes(',') ? location.split(',')[0] : location;
      const subArea = location.includes(',') ? location.split(',').slice(1).join(', ') : 'Central District';

      return {
        location,
        areaName,
        subArea,
        reports: areaReports,
        count: areaReports.length,
        top,
        left,
        probability: getBayesianProbability(location),
        priority: areaReports.some(r => r.priority > 7) || areaReports.length > 2 ? 'High' : 'Medium'
      };
    });
  }, [reports]);

  const handleAddCleaner = () => {
    if (!newCleanerName) return;
    onAddCleaner({
      id: `C${Math.floor(Math.random() * 1000)}`,
      name: newCleanerName,
      dept: newCleanerDept,
      status: 'Available'
    });
    setNewCleanerName("");
    setShowAddCleaner(false);
  };
  
  const chartData = [
    { name: 'Plastic', count: reports.filter(r => r.type === 'Plastic').length },
    { name: 'Organic', count: reports.filter(r => r.type === 'Organic').length },
    { name: 'Metal', count: reports.filter(r => r.type === 'Metal').length },
    { name: 'Paper', count: reports.filter(r => r.type === 'Paper').length },
    { name: 'Hazardous', count: reports.filter(r => r.type === 'Hazardous').length },
  ];

  const handleAssign = (report: WasteReport, cleaner: Cleaner) => {
    const isValid = validateAssignment(cleaner.dept, report.type);
    if (isValid) {
      onAssign(report.id, cleaner.id);
      setCspMessage("CSP Constraint Validated: Cleaner department matches waste type.");
      setTimeout(() => setCspMessage(null), 3000);
    } else {
      setCspMessage("CSP Constraint Failed: Cleaner department does not match waste type.");
      setTimeout(() => setCspMessage(null), 3000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-[#000080] rounded-full"></span>
            Admin Control Center
          </h2>
          <p className="text-gray-500 mt-1">Intelligent monitoring and resource allocation.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAddCleaner(true)}
            className="bg-[#000080] text-white px-6 py-3 rounded-2xl shadow-sm font-bold hover:bg-[#000060] transition-all flex items-center gap-2"
          >
            <Users size={20} />
            Add Cleaner
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Users className="text-[#000080]" size={20} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Active Cleaners</p>
              <p className="font-bold text-gray-800">{cleaners.length}</p>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Trash2 className="text-[#FF9933]" size={20} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Total Reports</p>
              <p className="font-bold text-gray-800">{reports.length}</p>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showAddCleaner && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4">Register New Cleaner</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                <input 
                  type="text" 
                  value={newCleanerName}
                  onChange={(e) => setNewCleanerName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full p-3 rounded-xl border border-gray-100 focus:border-[#000080] outline-none"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Department</label>
                <select 
                  value={newCleanerDept}
                  onChange={(e) => setNewCleanerDept(e.target.value as WasteType)}
                  className="w-full p-3 rounded-xl border border-gray-100 focus:border-[#000080] outline-none"
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Organic">Organic</option>
                  <option value="Metal">Metal</option>
                  <option value="Paper">Paper</option>
                  <option value="Hazardous">Hazardous</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddCleaner}
                  className="bg-[#138808] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0f6d06]"
                >
                  Save
                </button>
                <button 
                  onClick={() => setShowAddCleaner(false)}
                  className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Live Heatmap: Ahmedabad</h3>
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-red-500 text-xs font-bold">{hotspots.filter(h => h.priority === 'High').length} Priority Zones</span>
              </div>
            </div>
            
            <div className="relative aspect-video bg-[#f0f4f8] rounded-2xl overflow-hidden border border-gray-100 group shadow-inner">
              {/* Detailed Map Background Elements */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000080 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#000080 1px, transparent 1px), linear-gradient(90deg, #000080 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
              
              {/* Mock Road/River Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <path d="M0,100 Q400,150 800,50" stroke="#000080" strokeWidth="4" fill="none" />
                <path d="M200,0 Q250,200 150,400" stroke="#000080" strokeWidth="2" fill="none" />
                <path d="M600,0 Q550,200 650,400" stroke="#000080" strokeWidth="2" fill="none" />
              </svg>

              {hotspots.map((spot, i) => (
                <div 
                  key={i} 
                  className="absolute group/spot cursor-pointer" 
                  style={{ top: spot.top, left: spot.left }}
                  onClick={() => setExpandedArea(spot.location === expandedArea ? null : spot.location)}
                >
                  <motion.div
                    animate={{ 
                      scale: spot.count > 2 ? [1, 2.2, 1] : spot.count > 1 ? [1, 1.6, 1] : [1, 1.2, 1],
                      opacity: spot.count > 2 ? [0.4, 0.7, 0.4] : [0.2, 0.5, 0.2]
                    }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                    className={cn(
                      "w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2",
                      spot.count > 2 ? "bg-red-600" : spot.count > 1 ? "bg-red-400" : "bg-orange-300"
                    )}
                  ></motion.div>
                  <div className={cn(
                    "w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white",
                    spot.count > 2 ? "bg-red-700" : "bg-orange-600"
                  )}>
                    {spot.count}
                  </div>
                  
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/spot:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-[#000080] text-white p-3 rounded-xl shadow-xl w-64 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={12} className="text-[#FF9933]" />
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">{spot.areaName}</p>
                      </div>
                      <p className="text-[9px] text-white/60 mb-2 truncate">{spot.subArea}</p>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
                        <div>
                          <p className="text-[8px] text-white/40 uppercase">Reports</p>
                          <p className="text-xs font-bold">{spot.count}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/40 uppercase">Risk Level</p>
                          <p className={cn("text-xs font-bold", spot.priority === 'High' ? "text-red-400" : "text-orange-400")}>{spot.priority}</p>
                        </div>
                      </div>
                      <p className="text-[9px] mt-2 opacity-80">Bayesian Probability: <span className="text-[#FF9933] font-bold">{spot.probability}%</span></p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#000080]"></div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Unit IV: Probabilistic Models</p>
                <p className="text-xs text-gray-600">Priority areas identified by report frequency & GPS clusters.</p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedArea && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white p-8 rounded-3xl shadow-xl border-2 border-[#000080]/10"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#000080] flex items-center gap-2">
                      <MapPin size={20} />
                      Area Focus: {expandedArea}
                    </h3>
                    <p className="text-sm text-gray-500">Detailed view of all reports in this cluster.</p>
                  </div>
                  <button 
                    onClick={() => setExpandedArea(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotspots.find(h => h.location === expandedArea)?.reports.map((report) => (
                    <div key={report.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
                      {report.imageUrl ? (
                        <img src={report.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt="Waste" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                          <Trash2 className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-[#FF9933] uppercase">{report.type}</span>
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded-full",
                            report.status === 'Pending' ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                          )}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 mt-1">Priority: {report.priority}/10</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(report.timestamp).toLocaleString()}</p>
                        {report.latitude && (
                          <p className="text-[8px] text-gray-400 mt-1">GPS: {report.latitude.toFixed(4)}, {report.longitude?.toFixed(4)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-800">Waste Analytics</h3>
              <TrendingUp className="text-[#138808]" size={20} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8f8f8' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#FF9933', '#138808', '#000080', '#FF9933', '#138808'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Task Management</h3>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setTaskView('pending')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    taskView === 'pending' ? "bg-white shadow-sm text-[#000080]" : "text-gray-400"
                  )}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setTaskView('completed')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    taskView === 'completed' ? "bg-white shadow-sm text-[#138808]" : "text-gray-400"
                  )}
                >
                  Completed
                </button>
              </div>
            </div>

            {taskView === 'pending' ? (
              <>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-purple-600" />
                    <p className="text-[10px] text-purple-600 font-bold uppercase">Unit II: CSP</p>
                  </div>
                  <p className="text-xs text-purple-800">
                    Assignment logic uses Constraint Satisfaction to ensure cleaner expertise matches waste type.
                  </p>
                </div>

                {cspMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-xl text-xs font-bold mb-4 text-center",
                      cspMessage.includes("Validated") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}
                  >
                    {cspMessage}
                  </motion.div>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {pendingReports.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-10">No pending assignments.</p>
                  ) : (
                    pendingReports.map(report => (
                      <div key={report.id} className="space-y-3">
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer",
                          selectedReportId === report.id ? "border-[#000080] bg-blue-50 shadow-md" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                        )}
                        onClick={() => setSelectedReportId(report.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-[#FF9933] uppercase">{report.type}</span>
                            <span className="text-[10px] font-bold text-gray-400">ID: {report.id}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 truncate">{report.location}</p>
                        </div>

                        {selectedReportId === report.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pl-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Available Cleaners</p>
                            {cleaners.map(cleaner => (
                              <button
                                key={cleaner.id}
                                onClick={() => handleAssign(report, cleaner)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-[#138808] hover:shadow-sm transition-all group"
                              >
                                <div className="text-left">
                                  <p className="text-xs font-bold text-gray-800">{cleaner.name}</p>
                                  <p className="text-[10px] text-gray-400">Dept: {cleaner.dept}</p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#138808] transition-colors">
                                  <TrendingUp size={12} className="text-gray-300 group-hover:text-white" />
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {completedReports.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">No completed tasks yet.</p>
                  </div>
                ) : (
                  completedReports.map(report => (
                    <div key={report.id} className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[#138808] uppercase">{report.type}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                          <Shield size={10} />
                          <span>Verified</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate mb-1">{report.location}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-100/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#138808] flex items-center justify-center text-[10px] text-white font-bold">
                            {cleaners.find(c => c.id === report.assignedCleanerId)?.name[0] || 'C'}
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium">
                            {cleaners.find(c => c.id === report.assignedCleanerId)?.name || 'Cleaner'}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {new Date(report.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
