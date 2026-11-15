/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MultiQuestionForm } from '@/app/routes/chat-with-ai/components/multi-question-form';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('MultiQuestionForm focus', () => {
  it('focuses the first option when nothing else holds focus', () => {
    renderForm();
    const first = screen.getByRole('radio', { name: 'Gmail' });
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute('aria-checked')).toBe('false');
  });

  it('leaves focus in the composer when the card opens', () => {
    const composer = document.createElement('textarea');
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-chat-composer', '');
    wrapper.appendChild(composer);
    document.body.appendChild(wrapper);
    composer.focus();

    renderForm();

    expect(document.activeElement).toBe(composer);
  });

  it('does not draw the first option as chosen', () => {
    renderForm();
    const first = screen.getByRole('radio', { name: 'Gmail' });
    const classes = first.className.split(' ');
    expect(classes).not.toContain('bg-gray-3');
    expect(classes).not.toContain('bg-gray-4');
  });
});

function renderForm() {
  render(
    <MultiQuestionForm
      questions={[CHOICE_QUESTION]}
      onSubmit={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
}

const CHOICE_QUESTION: MultiQuestion = {
  type: 'choice',
  question: 'Which inbox?',
  options: [{ label: 'Gmail' }, { label: 'Outlook' }],
};
