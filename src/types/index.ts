export interface BuyerMatch {
  company: string;
  location: string;
  flag: string;
  matchScore: number;
  seeking: string;
  value: string;
  verified?: boolean;
  category?: string;
  lastShipment?: string;
  avgVolume?: string;
  topHsCodes?: string;
  rationale?: string;
}

export interface ChatMessage {
  sender: 'buyer' | 'me';
  text: string;
  time: string;
}

export interface ExportDocument {
  id: string;
  name: string;
  type: string;
  description: string;
  fileSize: string;
  icon: string;
  content: string;
}
