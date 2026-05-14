export type WasteType = 'Plastic' | 'Organic' | 'Metal' | 'Paper' | 'Hazardous';

export interface WasteReport {
  id: string;
  type: WasteType;
  priority: number;
  rewardPoints: number;
  timestamp: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  status: 'Pending' | 'Assigned' | 'Completed';
  imageUrl?: string | null;
  processingMethod?: string;
  impactMessage?: string;
}

export interface Cleaner {
  id: string;
  name: string;
  dept: WasteType;
  status: 'Available' | 'Busy';
  latitude?: number;
  longitude?: number;
}

export interface Assignment {
  reportId: string;
  cleanerId: string;
  timestamp: string;
}

export type ViewType = 'citizen' | 'cleaner' | 'admin';
