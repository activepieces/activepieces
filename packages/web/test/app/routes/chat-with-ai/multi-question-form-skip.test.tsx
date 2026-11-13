/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MultiQuestionForm } from '@/app/routes/chat-with-ai/components/multi-question-form';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('MultiQuestionForm Skip', () => {
  it('sends nothing when the only question, a color, is skipped', async () => {
    const { onSubmit, onDismiss } = renderForm([COLOR_QUESTION]);
    await screen.findByDisplayValue('#112233');

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('leaves a skipped color question out of the answers', async () => {
    const { onSubmit } = renderForm([CHOICE_QUESTION, COLOR_QUESTION]);

    fireEvent.click(screen.getByText('Gmail'));
    await screen.findByDisplayValue('#112233');
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSubmit).toHaveBeenCalledWith('- **Which inbox?** Gmail');
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
  options: [{ label: 'Gmail' }, { label: 'Outlook' }],
};

const COLOR_QUESTION: MultiQuestion = {
  type: 'color',
  question: 'Brand color?',
  presets: ['#112233', '#445566'],
};
