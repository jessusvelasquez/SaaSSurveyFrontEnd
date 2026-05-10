import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { surveysApi } from '../../../shared/api/surveys.api';
import { useApi } from '../../../shared/hooks/useApi';
import type { Answer, Question } from '../../../shared/types';

function QuestionStep({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  if (question.type === 'text') {
    return (
      <textarea
        className="textarea"
        placeholder="Escribe tu respuesta..."
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: 120 }}
      />
    );
  }

  if (question.type === 'single_choice') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {question.options.map((opt) => (
          <label
            key={opt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              border: `2px solid ${value === opt.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: value === opt.id ? 'var(--color-primary-light)' : 'transparent',
              transition: 'all var(--transition)',
            }}
          >
            <input type="radio" name={question.id} value={opt.id} checked={value === opt.id} onChange={() => onChange(opt.id)} style={{ display: 'none' }} />
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${value === opt.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: value === opt.id ? 'var(--color-primary)' : 'transparent',
              flexShrink: 0,
            }} />
            {opt.text}
          </label>
        ))}
      </div>
    );
  }

  // multiple_choice
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {question.options.map((opt) => {
        const checked = selected.includes(opt.id);
        return (
          <label
            key={opt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: checked ? 'var(--color-primary-light)' : 'transparent',
              transition: 'all var(--transition)',
            }}
          >
            <input type="checkbox" checked={checked} onChange={() => toggle(opt.id)} style={{ display: 'none' }} />
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: checked ? 'var(--color-primary)' : 'transparent',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              {checked && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
            </div>
            {opt.text}
          </label>
        );
      })}
    </div>
  );
}

export function SurveyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: survey, loading, error } = useApi(() => surveysApi.get(id!), [id]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="public-survey-container">
      <div className="loading-container"><div className="spinner" /><span>Cargando encuesta...</span></div>
    </div>
  );

  if (error || !survey || !survey.isPublished) return (
    <div className="public-survey-container">
      <div className="public-survey-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🔒</div>
        <h2>Encuesta no disponible</h2>
        <p className="text-muted mt-4">Esta encuesta no existe o no está publicada.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="public-survey-container">
      <div className="public-survey-card animate-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-3)' }}>¡Gracias por responder!</h2>
        <p className="text-muted">Tus respuestas han sido registradas exitosamente.</p>
      </div>
    </div>
  );

  const questions = survey.questions.sort((a, b) => a.order - b.order);
  const current = questions[currentStep];
  const isLast = currentStep === questions.length - 1;

  const handleNext = () => {
    if (!answers[current.id] || (Array.isArray(answers[current.id]) && (answers[current.id] as string[]).length === 0)) return;
    if (isLast) handleSubmit();
    else setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const userEmail = localStorage.getItem('survey_user_email') || 'anonymous@survey.com';
      const answerList: Answer[] = questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? '',
      }));
      await surveysApi.submitResponse(id!, {
        answers: answerList,
        userEmail
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error al enviar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentAnswer = answers[current?.id ?? ''];
  const hasAnswer = currentAnswer && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== '');

  return (
    <div className="public-survey-container">
      <div className="public-survey-card animate-in">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>{survey.title}</h1>
          {survey.description && <p className="text-muted">{survey.description}</p>}
        </div>

        {/* Step dots */}
        <div className="step-indicator">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Question */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-2)' }}>
            Pregunta {currentStep + 1} de {questions.length}
          </p>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>{current.text}</h2>

          <QuestionStep
            question={current}
            value={answers[current.id] ?? (current.type === 'multiple_choice' ? [] : '')}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [current.id]: v }))}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            className="btn btn-ghost"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            ← Anterior
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!hasAnswer || submitting}
          >
            {submitting ? 'Enviando...' : isLast ? '✅ Enviar respuestas' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
