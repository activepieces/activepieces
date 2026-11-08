/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { addDays, format, startOfDay } from 'date-fns';
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

describe('MultiQuestionForm Ask card', () => {
  it('keeps Next off until something is picked', () => {
    renderForm([CHOICE_QUESTION, COLOR_QUESTION]);
    expect(button('Next').disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Type your answer...'), {
      target: { value: 'Fastmail' },
    });

    expect(button('Next').disabled).toBe(false);
  });

  it('shows Back from the second question and goes back with the pick kept', async () => {
    renderForm([CHOICE_QUESTION, COLOR_QUESTION]);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();

    fireEvent.click(screen.getByText('Gmail'));
    await screen.findByDisplayValue('#112233');
    fireEvent.click(button('Back'));

    expect(screen.getByText('Which inbox?')).toBeTruthy();
    expect(
      screen
        .getByRole('option', { name: /Gmail/ })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(button('Next').disabled).toBe(false);
  });

  it('says Send on the last step and keeps Skip there', async () => {
    renderForm([CHOICE_QUESTION, COLOR_QUESTION]);
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();

    fireEvent.click(screen.getByText('Gmail'));
    await screen.findByDisplayValue('#112233');

    expect(screen.getAllByRole('button', { name: 'Send' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Skip' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('shows the step and the kind of answer in the meta line', () => {
    renderForm([CHOICE_QUESTION, COLOR_QUESTION]);
    expect(screen.getByText('Question 1 of 2 · pick one')).toBeTruthy();
  });

  it('picks a numbered option with its digit key', () => {
    const { onSubmit } = renderForm([CHOICE_QUESTION]);

    fireEvent.keyDown(screen.getByRole('option', { name: /Gmail/ }), {
      key: '2',
    });

    expect(onSubmit).toHaveBeenCalledWith('- **Which inbox?** Outlook');
  });

  it('shows a short icon question as a grid without search', () => {
    renderForm([iconQuestion(3)]);
    expect(screen.queryByPlaceholderText('Search options')).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('turns an icon grid of more than 9 options into a list with search', () => {
    renderForm([iconQuestion(10)]);

    const search = screen.getByPlaceholderText('Search options');
    fireEvent.change(search, { target: { value: 'App 10' } });

    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('sets the date with a quick pick', () => {
    const { onSubmit } = renderForm([DATE_QUESTION]);
    expect(button('Send').disabled).toBe(true);

    fireEvent.click(button('Tomorrow'));
    fireEvent.click(button('Send'));

    const tomorrow = addDays(startOfDay(new Date()), 1);
    expect(onSubmit).toHaveBeenCalledWith(
      `- **When should it start?** ${format(tomorrow, 'MMM d, yyyy')}`,
    );
  });

  it('opens the colour picker from the hex swatch', async () => {
    renderForm([COLOR_QUESTION]);
    await screen.findByDisplayValue('#112233');
    expect(document.querySelector('.react-colorful')).toBeNull();

    fireEvent.click(button('Open the colour picker'));

    expect(document.querySelector('.react-colorful')).not.toBeNull();
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

function button(name: string): HTMLButtonElement {
  const node = screen.getByRole('button', { name });
  if (!(node instanceof HTMLButtonElement)) throw new Error(name);
  return node;
}

function iconQuestion(count: number): MultiQuestion {
  return {
    type: 'choice',
    question: 'Which app?',
    options: Array.from({ length: count }, (_, i) => ({
      label: `App ${i + 1}`,
      icon: 'mail',
    })),
  };
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

const DATE_QUESTION: MultiQuestion = {
  type: 'date',
  question: 'When should it start?',
};
