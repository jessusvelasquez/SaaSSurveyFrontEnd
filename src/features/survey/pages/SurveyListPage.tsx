import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveysApi } from '../../../shared/api/surveys.api';
import type { Survey } from '../../../shared/types';
import './SurveyListPage.css';

export function SurveyListPage() {
  const [email, setEmail] = useState(localStorage.getItem('survey_user_email') || '');
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(!!email);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEmailSubmitted) {
      loadData();
    }
  }, [isEmailSubmitted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [surveysRes, responsesRes] = await Promise.all([
        surveysApi.listPublic(),
        surveysApi.getUserResponses(email)
      ]);
      
      const published = surveysRes.surveys.filter((s: Survey) => s.isPublished);
      setSurveys(published);
      
      const ids = new Set(responsesRes.responses.map((r: any) => r.surveyId));
      setCompletedIds(ids);
    } catch (error) {
      console.error('Error loading portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      localStorage.setItem('survey_user_email', email);
      setIsEmailSubmitted(true);
    }
  };

  const handleSelectSurvey = (id: string) => {
    navigate(`/survey/${id}`);
  };

  if (!isEmailSubmitted) {
    return (
      <div className="portal-container">
        <div className="portal-card animate-in">
          <div className="portal-icon">👋</div>
          <h1>Bienvenido al Portal</h1>
          <p>Por favor, ingresa tu correo electrónico para ver las encuestas disponibles para ti.</p>
          <form onSubmit={handleEmailSubmit} className="portal-form">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="portal-input"
            />
            <button type="submit" className="btn btn-primary w-full">Continuar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Encuestas Disponibles</h1>
              <p className="text-muted">Hola, {email} 👋</p>
            </div>
            <button
              className="btn btn-ghost text-sm"
              onClick={() => {
                localStorage.removeItem('survey_user_email');
                setIsEmailSubmitted(false);
                setEmail('');
              }}
            >
              Cambiar correo
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Buscando encuestas...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">empty</div>
            <h3>No hay encuestas disponibles</h3>
            <p>Vuelve más tarde para ver nuevas oportunidades de participación.</p>
          </div>
        ) : (
          <div className="survey-grid">
            {surveys.map((survey: any) => {
              const isCompleted = completedIds.has(survey.surveyId);
              return (
                <div
                  key={survey.surveyId}
                  className={`survey-card card animate-in ${isCompleted ? 'completed' : ''}`}
                  onClick={() => !isCompleted && handleSelectSurvey(survey.surveyId)}
                >
                  <div className="survey-card-content">
                    <div className="flex justify-between items-start mb-4">
                      {isCompleted ? (
                        <span className="badge badge-success">Completada ✅</span>
                      ) : (
                        <span className="badge badge-info">Nueva</span>
                      )}
                      <span className="text-xs text-muted">{survey.questions?.length || 0} preguntas</span>
                    </div>
                    <h3 className="survey-card-title">{survey.title}</h3>
                    <p className="survey-card-description">{survey.description}</p>
                  </div>
                  <div className="survey-card-footer">
                    <button className="btn btn-primary btn-sm w-full" disabled={isCompleted}>
                      {isCompleted ? '¡Ya participaste!' : 'Realizar Encuesta'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
