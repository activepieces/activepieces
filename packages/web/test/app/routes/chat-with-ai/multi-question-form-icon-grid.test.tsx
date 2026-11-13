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

describe('MultiQuestionForm icon grid', () => {
  it('lets you type your own answer under the icon grid', () => {
    const onSubmit = vi.fn();
    render(
      <MultiQuestionForm questions={[ICON_QUESTION]} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByPlaceholderText('Type your answer...'), {
      target: { value: 'Fastmail' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledWith('- **Which inbox?** Fastmail');
  });

  it('keeps arrow keys working in the answer field under the icon grid', () => {
    render(<MultiQuestionForm questions={[ICON_QUESTION]} onSubmit={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type your answer...');

    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(true);
  });

  it('shows Skip under the icon grid', () => {
    render(
      <MultiQuestionForm questions={[ICON_QUESTION]} onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
  });
});

const ICON_QUESTION: MultiQuestion = {
  type: 'choice',
  question: 'Which inbox?',
  options: [
    { label: 'Gmail', icon: 'mail' },
    { label: 'Outlook', icon: 'mail' },
  ],
};
