/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedbackButtons } from '@/app/routes/chat-with-ai/components/feedback-buttons';

const submitMessageFeedback = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: { submitMessageFeedback },
}));

afterEach(() => {
  cleanup();
  submitMessageFeedback.mockClear();
});

describe('FeedbackButtons (characterization)', () => {
  it('sends a thumbs up for its messageIndex', async () => {
    renderButtons();

    fireEvent.click(screen.getByRole('button', { name: 'Good response' }));

    await waitFor(() =>
      expect(submitMessageFeedback).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        messageIndex: 7,
        rating: 'up',
      }),
    );
    expect(screen.queryByRole('button', { name: 'Bad response' })).toBeNull();
  });

  it('sends a thumbs down for its messageIndex', async () => {
    renderButtons();

    fireEvent.click(screen.getByRole('button', { name: 'Bad response' }));

    await waitFor(() =>
      expect(submitMessageFeedback).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        messageIndex: 7,
        rating: 'down',
      }),
    );
  });

  it('clears the rating with null when the active thumb is clicked again', async () => {
    renderButtons({ initialRating: 'up' });

    fireEvent.click(screen.getByRole('button', { name: 'Good response' }));

    await waitFor(() =>
      expect(submitMessageFeedback).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        messageIndex: 7,
        rating: null,
      }),
    );
  });
});

function renderButtons({
  initialRating,
}: { initialRating?: 'up' | 'down' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <FeedbackButtons
        conversationId="conversation-1"
        messageIndex={7}
        initialRating={initialRating}
      />
    </QueryClientProvider>,
  );
}
