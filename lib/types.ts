export interface VocabularyEntry {
  arabic: string;
  transliteration: string;
  russian: string;
  example?: string;
}

export interface VocabularyData {
  topic: string;
  entries: VocabularyEntry[];
}

export interface GrammarRule {
  rule: string;
  arabic_example: string;
  transliteration: string;
  russian_translation: string;
}

export interface GrammarData {
  topic: string;
  explanation: string;
  rules: GrammarRule[];
}

export interface ExerciseQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface ExerciseData {
  type: 'translation' | 'fill_blank' | 'multiple_choice' | 'listening';
  title: string;
  questions: ExerciseQuestion[];
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  explanation: string;
}

export interface CorrectionData {
  corrections: CorrectionItem[];
  overall_feedback: string;
}

export type ToolResult =
  | { type: 'vocabulary'; data: VocabularyData }
  | { type: 'grammar'; data: GrammarData }
  | { type: 'exercise'; data: ExerciseData }
  | { type: 'correction'; data: CorrectionData };

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolResults: ToolResult[];
}
