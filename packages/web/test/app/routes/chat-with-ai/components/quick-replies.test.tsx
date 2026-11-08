/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuickReplies } from '@/app/routes/chat-with-ai/components/quick-replies';
import {
  RECURRING_AUTOMATION_REPLY,
  RecurringChip,
} from '@/app/routes/chat-with-ai/components/recurring-chip';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('RecurringChip (characterization)', () => {
  it('keeps the reply the server guides watch for', () => {
    expect(RECURRING_AUTOMATION_REPLY).toBe('Run this automatically every day');
  });

  it('calls onSend once on click', () => {
    const onSend = vi.fn();
    render(<RecurringChip onSend={onSend} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('QuickReplies (characterization)', () => {
  it('sends exactly RECURRING_AUTOMATION_REPLY from the recurring chip', () => {
    const onSend = vi.fn();
    render(
      <QuickReplies replies={[]} offerRecurringAutomation onSend={onSend} />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(RECURRING_AUTOMATION_REPLY);
  });

  it('sends the reply text when a quick reply is clicked', () => {
    const onSend = vi.fn();
    render(
      <QuickReplies
        replies={['Show me the flow', 'Try another channel']}
        offerRecurringAutomation={false}
        onSend={onSend}
      />,
    );

    fireEvent.click(screen.getByText('Try another channel'));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Try another channel');
  });

  it('shows at most 3 replies, or 2 plus the recurring chip, and drops a duplicate recurring reply', () => {
    const replies = ['One', 'Two', 'Three', 'Four'];
    const { rerender } = render(
      <QuickReplies
        replies={replies}
        offerRecurringAutomation={false}
        onSend={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);

    rerender(
      <QuickReplies
        replies={[RECURRING_AUTOMATION_REPLY, ...replies]}
        offerRecurringAutomation
        onSend={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getAllByText(RECURRING_AUTOMATION_REPLY)).toHaveLength(1);
    expect(screen.getByText('One')).toBeTruthy();
    expect(screen.getByText('Two')).toBeTruthy();
  });

  it('renders nothing with no replies and no recurring offer', () => {
    const { container } = render(
      <QuickReplies
        replies={[]}
        offerRecurringAutomation={false}
        onSend={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe('');
  });
});
