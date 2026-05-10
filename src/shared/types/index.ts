// Tipos compartidos entre componentes del FRONT
export type QuestionType = 'single_choice' | 'multiple_choice' | 'text';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  surveyId: string;
  text: string;
  type: QuestionType;
  order: number;
  options: QuestionOption[];
}

export interface Survey {
  surveyId: string;
  title: string;
  description: string;
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurveyDto {
  title: string;
  description?: string;
}

export interface UpdateSurveyDto {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface CreateQuestionDto {
  text: string;
  type: QuestionType;
  order?: number;
  options?: QuestionOption[];
}

export interface UpdateQuestionDto {
  text?: string;
  type?: QuestionType;
  order?: number;
  options?: QuestionOption[];
}

export interface Answer {
  questionId: string;
  value: string | string[];
}

export interface SubmitResponseDto {
  userEmail: string;
  answers: Answer[];
}

export interface QuestionAnalytics {
  surveyId: string;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  aggregatedData: Record<string, number>;
  updatedAt: string;
}
