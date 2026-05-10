import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as auth from 'aws-amplify/auth';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar el cargando mientras verifica la sesión', async () => {
    let resolveAuth: any;
    const authPromise = new Promise((resolve) => { resolveAuth = resolve; });
    vi.mocked(auth.getCurrentUser).mockReturnValue(authPromise as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
    
    // Resolvemos la promesa para limpiar el estado
    resolveAuth({ userId: '123' });
  });

  it('debe permitir el acceso si el usuario está autenticado', async () => {
    vi.mocked(auth.getCurrentUser).mockResolvedValue({ userId: '123', username: 'test' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Verificando sesión...')).not.toBeInTheDocument();
  });

  it('debe redirigir a login si el usuario no está autenticado', async () => {
    vi.mocked(auth.getCurrentUser).mockRejectedValue(new Error('No session'));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <div>Secret</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // Verificamos que al final aparezca la página de login
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
