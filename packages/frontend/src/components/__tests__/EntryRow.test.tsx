/*import { render, screen } from '@testing-library/react';
import { EntryRow } from '../EntryRow';
import { describe, it, expect } from 'vitest';

describe('EntryRow', () => {
  it('renders entry short text', () => {
    const entry = {
      id: 1,
      essenceShort: 'Test Entry',
      essenceText: 'Test Text',
      area: 'KNOWLEDGE' as const,
      topicId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 1,
    };
    
    render(<EntryRow entry={entry} onClick={() => {}} />);
    expect(screen.getByText('Test Entry')).toBeInTheDocument();
  });
});*/