import React, { useState, useRef } from 'react';
import { Upload, Camera, MapPin, CheckCircle2, Award, Loader2, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WasteReport, WasteType } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface CitizenViewProps {
  onReportSubmit: (report: WasteReport) => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({ onReportSubmit }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<Partial<WasteReport> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    // Get GPS location
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.warn("Geolocation failed or denied:", error);
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const imagePart = await fileToGenerativePart(file);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this image of waste. Identify the waste type (Plastic, Organic, Metal, Paper, or Hazardous), assign a priority score from 1 to 10 based on environmental impact/urgency, and suggest reward points (priority * 10). Also, determine the most likely processing method (e.g., Recycling, Biomass Conversion, Safe Disposal) and provide a short, inspiring message about how reporting this specific waste contributes to India's environment and the 'Swachh Bharat' mission. Return the result strictly in JSON format." },
              imagePart
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['Plastic', 'Organic', 'Metal', 'Paper', 'Hazardous'] },
                priority: { type: Type.NUMBER },
                rewardPoints: { type: Type.NUMBER },
                location_hint: { type: Type.STRING },
                processing_method: { type: Type.STRING },
                impact_message: { type: Type.STRING }
              },
              required: ['type', 'priority', 'rewardPoints', 'processing_method', 'impact_message']
          }
        }
      });

      const analysis = JSON.parse(response.text || '{}');
      
      const newReport: Partial<WasteReport> = {
        id: `R${Math.floor(Math.random() * 1000)}`,
        type: (analysis.type as WasteType) || 'Plastic',
        priority: analysis.priority || 5,
        rewardPoints: analysis.rewardPoints || 50,
        location: analysis.location_hint || "Ahmedabad, Gujarat",
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timestamp: new Date().toISOString(),
        status: 'Pending',
        imageUrl: previewUrl || null,
        processingMethod: analysis.processing_method,
        impactMessage: analysis.impact_message
      };

      setResult(newReport);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const confirmReport = () => {
    if (result) {
      onReportSubmit(result as WasteReport);
      setResult(null);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-[#FF9933] rounded-full"></span>
          Report Waste
        </h2>
        <p className="text-gray-500 mt-1">Help keep your city clean and earn rewards.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          {previewUrl ? (
            <div className="relative w-full aspect-video mb-6 rounded-2xl overflow-hidden border border-gray-100">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={40} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#FF9933]/10 rounded-full flex items-center justify-center mb-6">
              <Camera className="text-[#FF9933]" size={32} />
            </div>
          )}

          <h3 className="text-xl font-bold mb-2">{previewUrl ? "Change Image" : "Upload Image"}</h3>
          <p className="text-center text-gray-500 mb-8 text-sm px-10">
            Our Intelligent Classification System (Unit V) will automatically detect waste type and priority.
          </p>
          
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex items-center gap-2 bg-[#138808] text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50"
          >
            <Upload size={20} />
            {isUploading ? "Analyzing..." : "Select File"}
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border-2 border-[#138808]/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle2 className="text-[#138808]" size={24} />
              </div>

              <h3 className="text-xl font-bold mb-6 text-[#138808]">Analysis Results</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-sm">Waste Type</span>
                  <span className="font-bold text-gray-800">{result.type}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-sm">Priority Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF9933]" 
                        style={{ width: `${(result.priority || 0) * 10}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-800">{result.priority}/10</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#FF9933]/10 rounded-xl border border-[#FF9933]/20">
                  <div className="flex items-center gap-2">
                    <Award className="text-[#FF9933]" size={18} />
                    <span className="text-[#FF9933] font-bold text-sm">Reward Points</span>
                  </div>
                  <span className="font-bold text-[#FF9933] text-lg">+{result.rewardPoints}</span>
                </div>

                {result.processingMethod && (
                  <div className="p-4 bg-[#138808]/5 rounded-2xl border border-[#138808]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#138808] rounded-full flex items-center justify-center">
                        <Leaf className="text-white" size={14} />
                      </div>
                      <span className="text-[#138808] font-bold text-xs uppercase tracking-wider">Future Process</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{result.processingMethod}</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "{result.impactMessage}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                    <span>Location Details</span>
                    <button 
                      onClick={async () => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setResult(prev => prev ? {
                              ...prev,
                              latitude: pos.coords.latitude,
                              longitude: pos.coords.longitude
                            } : null);
                          });
                        }
                      }}
                      className="text-[#000080] hover:underline flex items-center gap-1"
                    >
                      <MapPin size={10} />
                      Detect GPS
                    </button>
                  </label>
                  <input 
                    type="text"
                    value={result.location || ""}
                    onChange={(e) => setResult(prev => prev ? { ...prev, location: e.target.value } : null)}
                    placeholder="Enter area or landmark name"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#000080] outline-none text-sm font-medium"
                  />
                  {result.latitude && (
                    <p className="text-[8px] text-gray-400 italic">
                      GPS Locked: {result.latitude.toFixed(4)}, {result.longitude?.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={confirmReport}
                className="w-full mt-8 bg-[#000080] text-white py-4 rounded-2xl font-bold hover:bg-[#000060] transition-colors"
              >
                Submit Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12">
        <h4 className="text-lg font-bold mb-4">Why SafaiSetu?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Smart Detection", desc: "AI-powered classification (Unit V)" },
            { title: "Quick Response", desc: "Optimized routing for cleaners" },
            { title: "Earn Rewards", desc: "Redeem points for city services" }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="font-bold text-[#000080] mb-1">{item.title}</h5>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
