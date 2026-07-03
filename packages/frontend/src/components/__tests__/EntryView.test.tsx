import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EntryView } from '../EntryView';
import { Entry } from '../../types';

const mockEntry: Entry = {
  id: 1,
  essenceText: 'Test Essence Text',
  essenceShort: 'Test Short',
  area: 'ACTIVE',
  actionName: 'Test Action',
  benefit: 'Test Benefit',
  status: 'ACTIVE',
  steps: [{ order: 0, description: 'Step 1' }, { order: 1, description: 'Step 2' }],
  currentStepIndex: 0,
  topicId: 1,
  userId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  trackings: [],
};

describe('EntryView', () => {
  it('renders entry data', () => {
    render(
      <EntryView
        entry={mockEntry}
        onEdit={vi.fn()}
        onStatusChange={vi.fn()}
        onStepChange={vi.fn()}
        onDelete={vi.fn()}
        onManualTrack={vi.fn()}
      />
    );

    expect(screen.getByText('Test Essence Text')).toBeInTheDocument();
    expect(screen.getByText('Test Short')).toBeInTheDocument();
    // actionName wird in EntryView nicht gerendert – nur in EntryDetail als Überschrift
    // Stattdessen prüfen wir den Status-Badge
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('calls onStatusChange when status button clicked', () => {
    const onStatusChange = vi.fn();
    render(
      <EntryView
        entry={mockEntry}
        onEdit={vi.fn()}
        onStatusChange={onStatusChange}
        onStepChange={vi.fn()}
        onDelete={vi.fn()}
        onManualTrack={vi.fn()}
      />
    );

    const pauseBtn = screen.getByRole('button', { name: /Status → Pause/i });
    fireEvent.click(pauseBtn);
    expect(onStatusChange).toHaveBeenCalledWith('PAUSED');
  });
});