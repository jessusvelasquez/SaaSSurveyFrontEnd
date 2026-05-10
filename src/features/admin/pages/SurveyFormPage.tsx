import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surveysApi } from '../../../shared/api/surveys.api';
import type { CreateQuestionDto, QuestionType } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

type FormQuestion = CreateQuestionDto & { existingId?: string };

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'single_choice', label: 'Opción única', icon: '🔘' },
  { value: 'multiple_choice', label: 'Opción múltiple', icon: '☑️' },
  { value: 'text', label: 'Texto libre', icon: '📝' },
];

// ─── QuestionBuilder ───────────────────────────────────────────────────────────
function QuestionBuilder({
  questions,
  surveyId,
  onChange,
  onDeleteImmediate,
  onSaveNewQuestion,
  onUpdateQuestion,
}: {
  questions: FormQuestion[];
  surveyId?: string;
  onChange: (q: FormQuestion[]) => void;
  onDeleteImmediate: (idx: number, existingId?: string) => Promise<void>;
  onSaveNewQuestion: (idx: number) => Promise<void>;
  onUpdateQuestion: (idx: number) => Promise<void>;
}) {
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  // Set de existingId con cambios pendientes (dirty)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const markDirty = (q: FormQuestion) => {
    if (q.existingId && surveyId) {
      setDirtyIds((prev) => new Set(prev).add(q.existingId!));
    }
  };

  const markClean = (existingId: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(existingId);
      return next;
    });
  };

  const updateQuestion = (idx: number, patch: Partial<CreateQuestionDto>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    markDirty(updated[idx]);
    onChange(updated);
  };

  const addOption = (qIdx: number) => {
    const q = questions[qIdx];
    updateQuestion(qIdx, { options: [...(q.options ?? []), { id: uuidv4(), text: '' }] });
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    const options = [...(questions[qIdx].options ?? [])];
    options[oIdx] = { ...options[oIdx], text };
    updateQuestion(qIdx, { options });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const options = (questions[qIdx].options ?? []).filter((_, i) => i !== oIdx);
    updateQuestion(qIdx, { options });
  };

  const handleConfirmDelete = async (idx: number) => {
    setDeletingIdx(idx);
    const q = questions[idx];
    if (q.existingId) markClean(q.existingId);
    await onDeleteImmediate(idx, q.existingId);
    setDeletingIdx(null);
    setConfirmDeleteIdx(null);
  };

  const handleSaveNew = async (idx: number) => {
    setSavingIdx(idx);
    await onSaveNewQuestion(idx);
    setSavingIdx(null);
  };

  const handleSaveExisting = async (idx: number) => {
    setSavingIdx(idx);
    await onUpdateQuestion(idx);
    const q = questions[idx];
    if (q.existingId) markClean(q.existingId);
    setSavingIdx(null);
  };

  const addNewLocal = () => {
    onChange([...questions, { text: '', type: 'single_choice', options: [{ id: uuidv4(), text: '' }, { id: uuidv4(), text: '' }] }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {questions.map((q, qIdx) => {
        const isDirty = q.existingId ? dirtyIds.has(q.existingId) : false;
        const isNew = !q.existingId;

        return (
          <div key={q.existingId ?? `new-${qIdx}`} className="question-item animate-in">

            {/* ── Header ── */}
            <div className="question-item-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="label">Pregunta {qIdx + 1}</span>
                {isNew && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Sin guardar</span>
                )}
                {isDirty && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Cambios pendientes</span>
                )}
              </div>

              {/* Confirmación inline de eliminación */}
              {confirmDeleteIdx === qIdx ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                    ⚠️ ¿Eliminar esta pregunta?
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={deletingIdx === qIdx}
                    onClick={() => handleConfirmDelete(qIdx)}
                  >
                    {deletingIdx === qIdx ? '...' : 'Sí, eliminar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmDeleteIdx(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmDeleteIdx(qIdx)}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>

            {/* ── Texto ── */}
            <input
              className="input"
              placeholder="Escribe el texto de esta pregunta..."
              value={q.text}
              onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
            />

            {/* ── Tipo ── */}
            <div>
              <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Tipo de respuesta</p>
              <div className="flex gap-2">
                {QUESTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      const opts =
                        t.value !== 'text' && (!q.options || q.options.length < 2)
                          ? [{ id: uuidv4(), text: '' }, { id: uuidv4(), text: '' }]
                          : q.options;
                      updateQuestion(qIdx, { type: t.value, options: opts });
                    }}
                    className={`btn btn-sm ${q.type === t.value ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Opciones ── */}
            {q.type !== 'text' && (
              <div style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              }}>
                <p className="label" style={{ marginBottom: 'var(--space-1)' }}>Opciones de respuesta</p>
                {(q.options ?? []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2 items-center">
                    <span className="text-muted text-sm" style={{
                      minWidth: 22, height: 22, background: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      {oIdx + 1}
                    </span>
                    <input
                      className="input"
                      placeholder={`Opción ${oIdx + 1}...`}
                      value={opt.text}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    />
                    {(q.options ?? []).length > 2 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(qIdx, oIdx)}>✕</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                  onClick={() => addOption(qIdx)}
                >
                  ＋ Agregar opción
                </button>
              </div>
            )}

            {/* ── Botón guardar: nueva pregunta ── */}
            {surveyId && isNew && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!q.text.trim() || savingIdx === qIdx}
                  onClick={() => handleSaveNew(qIdx)}
                >
                  {savingIdx === qIdx ? 'Guardando...' : '💾 Guardar pregunta'}
                </button>
              </div>
            )}

            {/* ── Botón guardar: pregunta existente con cambios ── */}
            {surveyId && !isNew && isDirty && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!q.text.trim() || savingIdx === qIdx}
                  onClick={() => handleSaveExisting(qIdx)}
                >
                  {savingIdx === qIdx ? 'Guardando...' : '💾 Guardar cambio'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Botón agregar pregunta */}
      <button
        type="button"
        onClick={addNewLocal}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-5)', background: 'var(--color-primary-light)',
          border: '2px dashed var(--color-primary)', borderRadius: 'var(--radius-lg)',
          color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          width: '100%', transition: 'all var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary-light)')}
      >
        <span style={{ fontSize: 20 }}>➕</span>
        Agregar nueva pregunta
      </button>
    </div>
  );
}

// ─── SurveyFormPage ────────────────────────────────────────────────────────────
export function SurveyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    surveysApi.get(id).then((survey) => {
      setTitle(survey.title);
      setDescription(survey.description ?? '');
      setQuestions(
        survey.questions
          .sort((a, b) => a.order - b.order)
          .map((q) => ({ existingId: q.id, text: q.text, type: q.type, order: q.order, options: q.options }))
      );
    }).catch(() => setError('No se pudo cargar la encuesta'))
      .finally(() => setLoadingData(false));
  }, [id]);

  // ── Eliminar pregunta de forma inmediata (sólo en edit mode) ──────────────
  const handleDeleteImmediate = async (idx: number, existingId?: string) => {
    if (existingId && id) {
      await surveysApi.deleteQuestion(id, existingId);
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Guardar una nueva pregunta de forma inmediata (edit mode) ─────────────
  const handleSaveNewQuestion = async (idx: number) => {
    if (!id) return;
    const { existingId: _, ...dto } = questions[idx];

    await surveysApi.addQuestion(id, dto);
    const freshSurvey = await surveysApi.get(id);

    const currentIds = new Set(
      questions.filter((q) => q.existingId).map((q) => q.existingId!)
    );
    const newQ = freshSurvey.questions.find((q) => !currentIds.has(q.id));

    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx ? { ...q, existingId: newQ?.id ?? `local-${Date.now()}` } : q
      )
    );
  };

  // ── Actualizar una pregunta existente de forma inmediata ──────────────────
  const handleUpdateQuestion = async (idx: number) => {
    if (!id) return;
    const { existingId, ...dto } = questions[idx];
    if (!existingId) return;
    await surveysApi.updateQuestion(id, existingId, dto);
  };


  // ── Guardar encuesta completa ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('El título es requerido'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit && id) {
        // En edit mode: solo guarda título/descripción
        await surveysApi.update(id, { title, description });
        navigate('/admin');
      } else {
        // En create mode: crea survey + agrega todas las preguntas
        const survey = await surveysApi.create({ title, description });
        for (const { existingId: _, ...dto } of questions) {
          await surveysApi.addQuestion(survey.surveyId, dto);
        }
        navigate('/admin');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) return (
    <div className="loading-container">
      <div className="spinner" />
      <span>Cargando encuesta...</span>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Editar Encuesta' : 'Nueva Encuesta'}</h1>
          <p className="page-subtitle">Configura el contenido y las preguntas</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin')}>← Volver</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 720 }}>
        {/* Info general */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Información general</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Título *</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Encuesta de satisfacción Q2 2025" required />
            </div>
            <div className="form-group">
              <label className="label">Descripción</label>
              <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el propósito de la encuesta..." />
            </div>
          </div>

          {/* Botón guardar info */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? '💾 Actualizar información' : '🚀 Crear encuesta'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/admin')}>Cancelar</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Preguntas */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Preguntas <span className="badge badge-primary">{questions.length}</span>
          </h2>
          <QuestionBuilder
            questions={questions}
            surveyId={id}
            onChange={setQuestions}
            onDeleteImmediate={handleDeleteImmediate}
            onSaveNewQuestion={handleSaveNewQuestion}
            onUpdateQuestion={handleUpdateQuestion}
          />
        </div>
      </form>
    </>
  );
}
