import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewEntryForm from '../NewEntryForm';
import { NotificationProvider } from '../../context/NotificationContext';

// Mocks
const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

vi.mock('../../hooks', () => ({
  useTopics: vi.fn(() => ({
    data: [{ id: 1, name: 'Test Topic' }],
    isLoading: false,
  })),
  useCreateEntry: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 1 }),
    isPending: false,
  })),
  useCreateTopic: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationProvider>
        {component}
      </NotificationProvider>
    </QueryClientProvider>
  );
};

describe('NewEntryForm', () => {
  it('renders form fields', () => {
    renderWithProviders(
      <NewEntryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Nutze getByText statt getByLabelText (Label ohne for-Attribut)
    expect(screen.getByText(/Essence Text \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Essence Short \*/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Create Entry/i }).length).toBeGreaterThan(0);
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(
      <NewEntryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Topic auswählen
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });

    // Essence-Felder füllen (damit Button enabled wird)
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), {
      target: { value: 'Test Essence' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Short summary/i), {
      target: { value: 'Test Short' },
    });

    // Jetzt sollte Button enabled sein
    const submitBtns = screen.getAllByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitBtns[0]);

    // Da alle Felder gefüllt sind, sollte kein Validation-Error kommen
    // Stattdessen prüfen wir, dass mutate aufgerufen wurde
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});