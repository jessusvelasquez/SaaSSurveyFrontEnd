import { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

type Step = 'login' | 'new_password';

export function LoginPage() {
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Login normal 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });

      // Cognito exige nueva contraseña (cuenta creada por admin)
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setStep('new_password');
        return;
      }

      navigate('/admin');
    } catch (err) {
      setError((err as Error).message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Establecer nueva contraseña 
  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await confirmSignIn({ challengeResponse: newPassword });
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message || 'Error al establecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="login-container">
      <div className="login-card animate-in">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📋</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SurveyOS</h1>
          <p className="text-muted text-sm" style={{ marginTop: 'var(--space-1)' }}>
            {step === 'login' ? 'Panel de Administración' : 'Configura tu contraseña'}
          </p>
        </div>

        {/* ── Formulario: Login ── */}
        {step === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Correo electrónico</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* ── Formulario: Nueva contraseña ── */}
        {step === 'new_password' && (
          <form onSubmit={handleNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            <div className="alert alert-success" style={{ marginBottom: 'var(--space-2)' }}>
              🔐 Por seguridad, debes establecer una nueva contraseña antes de continuar.
            </div>

            <div className="form-group">
              <label className="label">Nueva contraseña</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Confirmar contraseña</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : '✅ Establecer contraseña'}
            </button>

            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => { setStep('login'); setError(''); }}
            >
              ← Volver al login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
