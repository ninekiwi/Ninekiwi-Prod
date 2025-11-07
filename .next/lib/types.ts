export type UPhoto = {
  name: string;
  data: string;
  includeInSummary?: boolean;
  caption?: string;
  figureNumber?: number;
  description?: string;
  isFromCamera?: boolean;
  section?: string; // NEW: Track which section the photo belongs to
};
