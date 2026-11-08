/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatOptionItem,
  ChatOptionList,
} from '@/app/routes/chat-with-ai/components/chat-ui/chat-option';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => params?.[name] ?? ''),
}));

afterEach(() => {
  cleanup();
});

describe('ChatOptionList keyboard', () => {
  it('focuses the first option on mount', () => {
    renderList({ items: THREE });
    expect(document.activeElement).toBe(option('Gmail'));
  });

  it('focuses the selected option on mount', () => {
    renderList({ items: THREE, initialSelected: ['outlook'] });
    expect(document.activeElement).toBe(option('Outlook'));
  });

  it('does not take focus when autoFocus is off', () => {
    renderList({ items: THREE, autoFocus: false });
    expect(document.activeElement).toBe(document.body);
  });

  it('moves with the arrows and wraps around', () => {
    renderList({ items: THREE });
    fireEvent.keyDown(option('Gmail'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(option('Outlook'));
    fireEvent.keyDown(option('Outlook'), { key: 'ArrowDown' });
    fireEvent.keyDown(option('Yahoo'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(option('Gmail'));
    fireEvent.keyDown(option('Gmail'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(option('Yahoo'));
  });

  it('keeps one option in the tab order', () => {
    renderList({ items: THREE });
    fireEvent.keyDown(option('Gmail'), { key: 'ArrowDown' });
    expect(option('Gmail').tabIndex).toBe(-1);
    expect(option('Outlook').tabIndex).toBe(0);
  });

  it('wraps into the write-your-own field and leaves its arrows alone', () => {
    renderList({ items: THREE, withWriteYourOwn: true });
    fireEvent.keyDown(option('Gmail'), { key: 'ArrowUp' });
    const field = screen.getByPlaceholderText('Type your answer...');
    expect(document.activeElement).toBe(field);

    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(field);

    fireEvent.keyDown(option('Yahoo'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(field);
  });

  it('picks with Enter and Space', () => {
    const { onPick } = renderList({ items: THREE });
    fireEvent.keyDown(option('Gmail'), { key: 'Enter' });
    fireEvent.keyDown(option('Outlook'), { key: ' ' });
    expect(onPick.mock.calls).toEqual([['gmail'], ['outlook']]);
  });

  it('picks a numbered option with its digit key', () => {
    const { onPick } = renderList({ items: THREE, numbered: true });
    fireEvent.keyDown(option('Gmail'), { key: '3' });
    expect(onPick).toHaveBeenCalledWith('yahoo');
    expect(document.activeElement).toBe(option('Yahoo'));
  });

  it('ignores digit keys when the list is not numbered', () => {
    const { onPick } = renderList({ items: THREE });
    fireEvent.keyDown(option('Gmail'), { key: '2' });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('submits the typed answer on Enter but not while composing', () => {
    const { onSubmit } = renderList({ items: THREE, withWriteYourOwn: true });
    const field = screen.getByPlaceholderText('Type your answer...');
    fireEvent.change(field, { target: { value: 'Proton' } });

    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('marks the picked option as selected', () => {
    renderList({ items: THREE });
    fireEvent.click(option('Outlook'));
    expect(option('Outlook').getAttribute('aria-selected')).toBe('true');
    expect(option('Gmail').getAttribute('aria-selected')).toBe('false');
  });
});

describe('ChatOptionList search', () => {
  it('has no search with 6 items or fewer', () => {
    renderList({ items: makeItems(6) });
    expect(screen.queryByRole('textbox', { name: 'Search projects' })).toBe(
      null,
    );
  });

  it('shows search above 6 items and focuses it', () => {
    renderList({ items: makeItems(7) });
    const search = screen.getByRole('textbox', { name: 'Search projects' });
    expect(document.activeElement).toBe(search);
  });

  it('filters by label', () => {
    renderList({ items: makeItems(7) });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search projects' }), {
      target: { value: 'project 7' },
    });
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows a no-match line and clears the search', () => {
    renderList({ items: makeItems(7) });
    const search = screen.getByRole('textbox', { name: 'Search projects' });
    fireEvent.change(search, { target: { value: 'zzq' } });

    expect(screen.getByText('No project matches "zzq"')).toBeTruthy();
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getAllByRole('option')).toHaveLength(7);
    expect(document.activeElement).toBe(search);
  });
});

function renderList({
  items,
  initialSelected = [],
  numbered = false,
  withWriteYourOwn = false,
  autoFocus = true,
}: {
  items: ChatOptionItem[];
  initialSelected?: string[];
  numbered?: boolean;
  withWriteYourOwn?: boolean;
  autoFocus?: boolean;
}) {
  const onPick = vi.fn();
  const onSubmit = vi.fn();
  function Harness() {
    const [selected, setSelected] = useState(initialSelected);
    const [answer, setAnswer] = useState('');
    return (
      <ChatOptionList
        items={items}
        mode="radio"
        selected={selected}
        onPick={(id) => {
          onPick(id);
          setSelected([id]);
        }}
        ariaLabel="Pick one"
        numbered={numbered}
        autoFocus={autoFocus}
        searchPlaceholder="Search projects"
        noMatchText={(query) => `No project matches "${query}"`}
        writeYourOwn={
          withWriteYourOwn
            ? {
                value: answer,
                onChange: setAnswer,
                onSubmit,
                placeholder: 'Type your answer...',
              }
            : undefined
        }
      />
    );
  }
  render(<Harness />);
  return { onPick, onSubmit };
}

function option(name: string): HTMLElement {
  return screen.getByRole('option', { name });
}

function makeItems(count: number): ChatOptionItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    label: `Project ${index + 1}`,
  }));
}

const THREE: ChatOptionItem[] = [
  { id: 'gmail', label: 'Gmail' },
  { id: 'outlook', label: 'Outlook' },
  { id: 'yahoo', label: 'Yahoo' },
];
