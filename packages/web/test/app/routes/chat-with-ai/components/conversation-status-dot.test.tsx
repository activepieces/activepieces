/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConversationStatusDot } from '@/app/routes/chat-with-ai/components/conversation-status-dot';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(cleanup);

describe('ConversationStatusDot', () => {
  it('shows a spinner for a working chat, with no ping', () => {
    const { container } = render(<ConversationStatusDot state="working" />);

    const mark = screen.getByRole('img', { name: 'Working…' });
    expect(mark.querySelector('svg')?.getAttribute('class')).toContain(
      'animate-spin',
    );
    expect(container.querySelector('.animate-ping')).toBeNull();
  });

  it('shows the ring and dot for a chat that needs you', () => {
    const { container } = render(<ConversationStatusDot state="waiting" />);

    const mark = screen.getByRole('img', { name: 'Waiting for your input' });
    const svg = mark.querySelector('svg');
    expect(svg?.querySelectorAll('circle')).toHaveLength(2);
    expect(svg?.getAttribute('class')).not.toContain('animate-spin');
    expect(container.querySelector('.animate-ping')).toBeNull();
  });

  it('shows a small dark dot for an unread chat', () => {
    render(<ConversationStatusDot state="unread" />);

    const mark = screen.getByRole('img', { name: 'New response' });
    expect(mark.querySelector('svg')).toBeNull();
    expect(mark.querySelector('.bg-gray-12')).not.toBeNull();
  });
});
