import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Layout } from '../Layout';
import { BrowserRouter } from 'react-router-dom';
import * as auth from 'aws-amplify/auth';

// Mock del modulo de navegacion para verificar redirecciones
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <Layout>
          <div data-testid="child-content">Content</div>
        </Layout>
      </BrowserRouter>
    );
  };

  it('debe renderizar el logo y los elementos de navegación', () => {
    renderLayout();
    expect(screen.getByText('SurveyOS')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nueva Encuesta')).toBeInTheDocument();
  });

  it('debe mostrar el email del usuario logueado', async () => {
    const mockEmail = 'admin@surveyos.com';
    vi.mocked(auth.fetchUserAttributes).mockResolvedValue({ email: mockEmail });

    renderLayout();

    await waitFor(() => {
      expect(screen.getByText(mockEmail)).toBeInTheDocument();
    });
  });

  it('debe llamar a signOut y navegar a login al hacer clic en cerrar sesión', async () => {
    renderLayout();

    const logoutButton = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutButton);

    expect(auth.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('debe renderizar el contenido hijo (children)', () => {
    renderLayout();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
