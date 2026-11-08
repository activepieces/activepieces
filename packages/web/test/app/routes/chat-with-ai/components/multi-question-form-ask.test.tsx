/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { MultiQuestionForm } from '@/app/routes/chat-with-ai/components/multi-question-form';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? ''),
    ),
}));

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        return undefined;
      }
      unobserve() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    },
  );
});

afterEach(() => {
  cleanup();
});

describe('MultiQuestionForm recap', () => {
  it('sends one recap line per answered question', async () => {
    const { onSubmit } = renderForm([CHOICE_QUESTION, COLOR_QUESTION]);

    fireEvent.click(screen.getByText('Gmail'));
    await screen.findByDisplayValue('#112233');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      '- **Which inbox?** Gmail\n- **Brand color?** #112233',
    );
  });

  it('sends a numbered option picked with its digit key', () => {
    const { onSubmit } = renderForm([CHOICE_QUESTION]);

    fireEvent.keyDown(screen.getByRole('option', { name: /Gmail/ }), {
      key: '2',
    });

    expect(onSubmit).toHaveBeenCalledWith('- **Which inbox?** Outlook');
  });
});

function renderForm(questions: MultiQuestion[]) {
  const onSubmit = vi.fn();
  const onDismiss = vi.fn();
  render(
    <MultiQuestionForm
      questions={questions}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
    />,
  );
  return { onSubmit, onDismiss };
}

const CHOICE_QUESTION: MultiQuestion = {
  type: 'choice',
  question: 'Which inbox?',
  options: [{ label: 'Gmail' }, { label: 'Outlook' }, { label: 'Yahoo' }],
};

const COLOR_QUESTION: MultiQuestion = {
  type: 'color',
  question: 'Brand color?',
  presets: ['#112233', '#445566'],
};
