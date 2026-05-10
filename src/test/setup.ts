import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks
vi.mock('aws-amplify/auth', () => ({
  signOut: vi.fn(),
  fetchUserAttributes: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
  getCurrentUser: vi.fn().mockResolvedValue({ userId: '123', username: 'testuser' }),
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: {
      idToken: { toString: () => 'fake-token' }
    }
  }),
}));

// Mock para react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
