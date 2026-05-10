import { useNavigate } from 'react-router-dom';
import { surveysApi } from '../../../shared/api/surveys.api';
import { useApi, useMutation } from '../../../shared/hooks/useApi';
import type { Survey } from '../../../shared/types';

function SurveyCard({ survey, onDelete, onTogglePublish }: {
  survey: Survey;
  onDelete: (id: string) => void;
  onTogglePublish: (survey: Survey) => void;
}) {
  const navigate = useNavigate();
  const publicUrl = `${window.location.origin}/survey/${survey.surveyId}`;

  return (
    <div className="survey-card">
      <div>
        <div className="survey-card-meta">
          <span className={`badge ${survey.isPublished ? 'badge-success' : 'badge-warning'}`}>
            {survey.isPublished ? '● Publicada' : '○ Borrador'}
          </span>
          <span className="text-sm text-muted">{survey.questions.length} preguntas</span>
        </div>
        <h3 className="survey-card-title" style={{ marginTop: 'var(--space-2)' }}>{survey.title}</h3>
        {survey.description && (
          <p className="survey-card-desc">{survey.description}</p>
        )}
      </div>

      <div className="survey-card-actions" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/surveys/${survey.surveyId}/edit`)}>
          ✏️ Editar
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/surveys/${survey.surveyId}/results`)}>
          📊 Resultados
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { navigator.clipboard.writeText(publicUrl); alert('¡Link copiado!'); }}
        >
          🔗 Copiar link
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onTogglePublish(survey)}>
          {survey.isPublished ? '🔒 Despublicar' : '🚀 Publicar'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(survey.surveyId)}>
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => surveysApi.list(), []);
  const { mutate: deleteSurvey } = useMutation((id: string) => surveysApi.delete(id));
  const { mutate: updateSurvey } = useMutation(
    ({ id, dto }: { id: string; dto: { isPublished: boolean } }) => surveysApi.update(id, dto)
  );

  const surveys = data?.surveys ?? [];
  const published = surveys.filter((s) => s.isPublished).length;

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta encuesta?')) return;
    await deleteSurvey(id);
    refetch();
  };

  const handleTogglePublish = async (survey: Survey) => {
    await updateSurvey({ id: survey.surveyId, dto: { isPublished: !survey.isPublished } });
    refetch();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Gestiona todas tus encuestas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/surveys/new')}>
          ➕ Nueva Encuesta
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary-light)' }}>📋</div>
          <div className="stat-value">{surveys.length}</div>
          <div className="stat-label">Encuestas Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div>
          <div className="stat-value">{published}</div>
          <div className="stat-label">Publicadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>📝</div>
          <div className="stat-value">{surveys.length - published}</div>
          <div className="stat-label">Borradores</div>
        </div>
      </div>

      {/* Surveys list */}
      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <span>Cargando encuestas...</span>
        </div>
      )}

      {error && <div className="alert alert-error">Error: {error}</div>}

      {!loading && surveys.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No tienes encuestas aún</div>
          <p>Crea tu primera encuesta para empezar a recopilar datos</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/admin/surveys/new')}>
            Crear mi primera encuesta
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {surveys.map((survey) => (
          <SurveyCard
            key={survey.surveyId}
            survey={survey}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
          />
        ))}
      </div>
    </>
  );
}
