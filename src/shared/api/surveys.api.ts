import { fetchAuthSession } from 'aws-amplify/auth';
import axios, { type AxiosRequestConfig } from 'axios';
import type { Survey, CreateSurveyDto, UpdateSurveyDto, CreateQuestionDto, UpdateQuestionDto, SubmitResponseDto, QuestionAnalytics, Question } from '../types';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

// Configuración de instancia de Axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar Token de Cognito automáticamente
api.interceptors.request.use(async (config) => {
  // Solo inyectamos token si la ruta no es pública
  const isPublic = config.url?.includes('/public') || config.url?.includes('/responses');

  if (!isPublic) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        config.headers.Authorization = token;
      }
    } catch (err) {
      console.warn('[API] No session found for protected route');
    }
  }
  return config;
});

// Función genérica para manejar peticiones
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Error en la petición';
    throw new Error(message);
  }
}

// ─── Surveys API ──────────────────────────────────────────────────────────────
export const surveysApi = {
  // Rutas públicas (sin auth)
  get: (id: string) =>
    request<Survey>({ url: `/surveys/${id}`, method: 'GET' }),

  submitResponse: (surveyId: string, data: SubmitResponseDto) =>
    request<{ responseId: string }>({ url: `/surveys/${surveyId}/responses`, method: 'POST', data }),

  getUserResponses: (email: string) =>
    request<{ responses: any[] }>({ url: `/surveys/responses/user/${encodeURIComponent(email)}`, method: 'GET' }),

  listPublic: () =>
    request<{ surveys: Survey[]; count: number }>({ url: '/surveys/public', method: 'GET' }),

  // Rutas admin (el interceptor inyectará el token)
  list: () =>
    request<{ surveys: Survey[]; count: number }>({ url: '/surveys', method: 'GET' }),

  create: (data: CreateSurveyDto) =>
    request<Survey>({ url: '/surveys', method: 'POST', data }),

  update: (id: string, data: UpdateSurveyDto) =>
    request<Survey>({ url: `/surveys/${id}`, method: 'PUT', data }),

  delete: (id: string) =>
    request<void>({ url: `/surveys/${id}`, method: 'DELETE' }),

  addQuestion: (surveyId: string, data: CreateQuestionDto) =>
    request<Question>({ url: `/surveys/${surveyId}/question`, method: 'POST', data }),

  updateQuestion: (surveyId: string, questionId: string, data: UpdateQuestionDto) =>
    request<Question>({ url: `/surveys/${surveyId}/question/${questionId}`, method: 'PUT', data }),

  deleteQuestion: (surveyId: string, questionId: string) =>
    request<void>({ url: `/surveys/${surveyId}/question/${questionId}`, method: 'DELETE' }),

  getResults: (surveyId: string) =>
    request<{ results: QuestionAnalytics[] }>({ url: `/surveys/${surveyId}/results`, method: 'GET' }),
};
