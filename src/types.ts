export type ElementType = 'text_input' | 'select_dropdown' | 'connect_dot' | 'hotspot_choice';

export interface InteractiveElement {
  id: string;
  type: ElementType;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  correctAnswer: string; // Correct answer or acceptable answers separated by |
  options?: string[]; // For select_dropdown
  placeholder?: string;
  hint?: string;
  points: number;
  fontSize?: number;
  caseSensitive?: boolean;
  ignoreAccents?: boolean;
  // For hotspot_choice / checkbox / true_false
  choiceMode?: 'checkbox' | 'true_false';
  // For connect_dot
  pairId?: string; // Matching dot pair identifier
  dotRole?: 'start' | 'end' | 'neutral';
  dotColor?: string;
  dotLabel?: string;
}

export interface LineConnection {
  id: string;
  fromId: string;
  toId: string;
}

export interface WorksheetData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  instructions: string;
  imageUrl: string;
  elements: InteractiveElement[];
  // For student mode
  connections?: LineConnection[];
}

export interface EvaluationResult {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  elementResults: Record<string, boolean>;
  connectionResults: Record<string, boolean>;
  completedCount: number;
  totalCount: number;
}
