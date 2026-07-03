import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Login } from '../Login';

// Mocks für Hooks
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
    loading: false,
  })),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotification: vi.fn(() => ({
    showNotification: mockShowNotification,
    notifications: [],
  })),
}));

describe('Login', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('calls login on submit', () => {
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
  });
});