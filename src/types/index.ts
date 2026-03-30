export interface IncomingData {
  userId: string;
  teamId: string;
  timestamp: string;
  image: string; // base64 encoded
  countCycle: number;
}

export interface ImageAnalysis {
  userId: string;
  teamId: string;
  timestamp: string;
  countCycle: number;
  description: string;
  aiDependencyFlag: boolean;
  confidence: number;
}

export interface BatchSummary {
  userId: string;
  teamId: string;
  startTime: string;
  endTime: string;
  analyses: ImageAnalysis[];
  gptSummary: string;
  gptScore: number;
  llamaSummary: string;
  llamaScore: number;
  meanScore: number;
  aiDependencyDetected: boolean;
}

export interface QueueItem {
  id: string;
  data: IncomingData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  result?: ImageAnalysis;
  error?: string;
}
