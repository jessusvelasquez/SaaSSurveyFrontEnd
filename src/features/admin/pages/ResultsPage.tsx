import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { surveysApi } from '../../../shared/api/surveys.api';
import { useApi } from '../../../shared/hooks/useApi';
import type { QuestionAnalytics, Survey, Question } from '../../../shared/types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const ON_SURVEY_RESULT_UPDATED = /* GraphQL */ `
  subscription OnSurveyResultUpdated($surveyId: String!) {
    onSurveyResultUpdated(surveyId: $surveyId) {
      surveyId questionId questionText questionType totalResponses aggregatedData updatedAt
    }
  }
`;

function BarChartResult({ analytics, questions }: { analytics: QuestionAnalytics; questions: Question[] }) {
  const question = questions.find(q => q.id === analytics.questionId);

  const data = Object.entries(analytics.aggregatedData)
    .map(([id, value]) => {
      const option = question?.options.find(o => o.id === id);
      return {
        name: option ? option.text : id,
        value
      };
    })
    .sort((a, b) => (b.value as number) - (a.value as number));

  return (
    <div style={{ height: 250, marginTop: 'var(--space-4)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            width={100}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
          />
          <Bar dataKey="value" fill="url(#colorBar)" radius={[0, 4, 4, 0]}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartResult({ analytics, questions }: { analytics: QuestionAnalytics; questions: Question[] }) {
  const question = questions.find(q => q.id === analytics.questionId);

  const data = Object.entries(analytics.aggregatedData).map(([id, value]) => {
    const option = question?.options.find(o => o.id === id);
    return {
      name: option ? option.text : id,
      value
    };
  });

  return (
    <div style={{ height: 300, display: 'flex', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TextResults({ analytics }: { analytics: QuestionAnalytics }) {
  const responses = Object.entries(analytics.aggregatedData);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
      <p className="text-muted text-xs uppercase tracking-wider font-bold mb-2">Últimas respuestas de texto</p>
      {responses.length === 0 ? (
        <p className="text-muted italic text-sm">Esperando respuestas...</p>
      ) : (
        responses.slice(0, 10).map(([text, count], i) => (
          <div key={i} className="animate-in" style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--space-3)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-md)',
            animationDelay: `${i * 0.05}s`
          }}>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>"{text}"</span>
            {Number(count) > 1 && <span className="badge badge-primary">{count}x</span>}
          </div>
        ))
      )}
    </div>
  );
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading } = useApi(() => surveysApi.getResults(id!), [id]);

  // Estado para el título de la encuesta
  const [surveyInfo, setSurveyInfo] = useState<Survey | null>(null);

  // Estado local para permitir actualizaciones en tiempo real instantáneas
  const [realTimeResults, setRealTimeResults] = useState<QuestionAnalytics[]>([]);

  // Carga info de la encuesta
  useEffect(() => {
    if (!id) return;
    surveysApi.get(id).then(setSurveyInfo);
  }, [id]);

  // Sincroniza el estado local cuando cargan los datos iniciales de la API
  useEffect(() => {
    if (data?.results) {
      setRealTimeResults(data.results);
    }
  }, [data]);

  // AppSync real-time subscription
  useEffect(() => {
    if (!id) return;
    const client = generateClient();
    const sub = (client.graphql({ query: ON_SURVEY_RESULT_UPDATED, variables: { surveyId: id } }) as any)
      .subscribe({
        next: ({ data }: any) => {
          if (!data?.onSurveyResultUpdated) return;

          const updated: QuestionAnalytics = {
            ...data.onSurveyResultUpdated,
            aggregatedData: JSON.parse(data.onSurveyResultUpdated.aggregatedData ?? '{}'),
          };

          setRealTimeResults((prev) => {
            const index = prev.findIndex(r => r.questionId === updated.questionId);
            if (index === -1) return [...prev, updated];

            const next = [...prev];
            next[index] = updated;
            return next;
          });
        },
        error: (err: unknown) => {
          console.error('[subscription error]', err);
        },
      });

    return () => sub.unsubscribe();
  }, [id]);

  const results = realTimeResults;
  const questions = surveyInfo?.questions ?? [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {surveyInfo ? `Resultados: ${surveyInfo.title}` : 'Cargando resultados...'}
          </h1>
          {surveyInfo?.description && (
            <p className="text-muted text-sm" style={{ marginTop: 'var(--space-1)' }}>
              {surveyInfo.description}
            </p>
          )}
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-3)' }}>
            <div className="live-indicator"><div className="live-dot" />LIVE</div>
            <span className="text-muted text-sm">{results.length} preguntas analizadas</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin')}>← Volver</button>
      </div>

      {loading && (
        <div className="loading-container"><div className="spinner" /><span>Cargando resultados...</span></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {results.map((analytics) => (
          <div key={analytics.questionId} className="card animate-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 style={{ fontWeight: 700 }}>{analytics.questionText}</h3>
                <span className="badge badge-primary" style={{ marginTop: 'var(--space-1)' }}>
                  {analytics.totalResponses} respuestas
                </span>
              </div>
              <span className="text-muted text-sm">{analytics.questionType.replace('_', ' ')}</span>
            </div>

            {analytics.questionType === 'single_choice' && <PieChartResult analytics={analytics} questions={questions} />}
            {analytics.questionType === 'multiple_choice' && <BarChartResult analytics={analytics} questions={questions} />}
            {analytics.questionType === 'text' && <TextResults analytics={analytics} />}
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Sin respuestas aún</div>
            <p>Los resultados aparecerán aquí en tiempo real cuando los usuarios respondan</p>
          </div>
        )}
      </div>
    </>
  );
}
