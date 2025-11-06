export interface DiagnosisData {
  userName?: string;
  companyName?: string;
  email?: string;
  businessType?: 'appointment_services' | 'quote_services' | 'recurring_services' | 'products';
  
  // Appointment-based services
  monthlyAppointments?: number;
  noShowRate?: number;
  ticketPrice?: number;
  
  // Quote-based services
  monthlyQuotes?: number;
  quoteConversionRate?: number; // e.g., 0.2 for 20%
  avgDealValue?: number;

  // Recurring services
  activeSubscribers?: number;
  monthlyChurnRate?: number; // e.g., 0.05 for 5%
  avgSubscriptionFee?: number;
  memberEngagementProcess?: 'manual_inconsistent' | 'basic_automation' | 'inactive';

  // Product sales (Local Business)
  avgOrderValueLocal?: number;
  weeklyLostSalesLocal?: number;
  repetitiveQuestionsLocal?: 'constant' | 'sometimes' | 'rarely';
  localOrderProcess?: 'manual_chaotic' | 'manual_organized' | 'no_orders';
  promotionCommunication?: 'manual_broadcast' | 'social_media_only' | 'inactive';
  
  // Common
  manualCommHours?: string;
  offHoursResponse?: string;
  reviewRequestProcess?: string;
  clientReengagementProcess?: string;
  mainBottleneck?: string;
}

export interface AISolution {
  title: string;
  description: string;
  impact: 'Alto' | 'Médio' | 'Baixo';
  implementationTime: string;
  expectedROI: string;
  benefits: string[];
  detailedExplanation: string;
}

export interface DiagnosisResult {
  potentialTransformationScore: number;
  potentialEconomy: string;
  timeRecovered: string;
  productivityGain: string;
  implementationTimeframe: string;
  solutions: AISolution[];
  executiveSummary: string;
}

export interface ChatMessage {
  sender: 'user' | 'nexus';
  text: string;
  isTyping?: boolean;
  options?: { text: string; value: any }[];
  input?: { type: 'text' | 'email' | 'number'; placeholder: string; key: keyof DiagnosisData };
  isInputSubmitted?: boolean;
}