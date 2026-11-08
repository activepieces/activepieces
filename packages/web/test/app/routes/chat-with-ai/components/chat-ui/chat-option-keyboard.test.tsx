/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatOption,
  ChatOptionGrid,
  ChatOptionItem,
  ChatOptionList,
  ChatOptionMode,
} from '@/app/routes/chat-with-ai/components/chat-ui/chat-option';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => params?.[name] ?? ''),
}));

afterEach(() => {
  cleanup();
});

describe('ChatOption on its own', () => {
  it('lets Space click a standalone option', () => {
    render(<ChatOption mode="action" label="Show all" onPick={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Show all' });
    expect(fireEvent.keyUp(button, { key: ' ' })).toBe(true);
  });

  it('cancels the native Space click when a list handles keys', () => {
    render(
      <ChatOption
        mode="action"
        label="Show all"
        onPick={vi.fn()}
        onKeyDown={vi.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: 'Show all' });
    expect(fireEvent.keyUp(button, { key: ' ' })).toBe(false);
  });

  it('renders a trailing action beside the row, even when disabled', () => {
    const onPick = vi.fn();
    const onReconnect = vi.fn();
    render(
      <ChatOption
        mode="radio"
        label="Gmail work"
        disabled
        onPick={onPick}
        action={<button onClick={onReconnect}>Reconnect</button>}
      />,
    );
    const option = screen.getByRole('option', { name: 'Gmail work' });
    expect(option.hasAttribute('disabled')).toBe(true);
    const reconnect = screen.getByRole('button', { name: 'Reconnect' });
    expect(option.contains(reconnect)).toBe(false);
    fireEvent.click(reconnect);
    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });
});

describe('ChatOptionList keys', () => {
  it('ignores digits and Enter with a modifier', () => {
    const { onPick } = renderList({ items: THREE, numbered: true });
    const gmail = screen.getByRole('option', { name: 'Gmail' });
    fireEvent.keyDown(gmail, { key: '2', metaKey: true });
    fireEvent.keyDown(gmail, { key: '2', ctrlKey: true });
    fireEvent.keyDown(gmail, { key: '3', altKey: true });
    fireEvent.keyDown(gmail, { key: 'Enter', ctrlKey: true });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('moves from the search box into the list with ArrowDown', () => {
    renderList({ items: makeItems(7) });
    const search = screen.getByRole('textbox', { name: 'Search' });
    expect(document.activeElement).toBe(search);
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      screen.getByRole('option', { name: 'Project 1' }),
    );
  });

  it('picks the only match with Enter in the search box', () => {
    const { onPick } = renderList({ items: makeItems(7) });
    const search = screen.getByRole('textbox', { name: 'Search' });
    fireEvent.change(search, { target: { value: 'project 5' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('p5');
  });

  it('does not pick from search while more than one matches', () => {
    const { onPick } = renderList({ items: makeItems(7) });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), {
      key: 'Enter',
    });
    expect(onPick).not.toHaveBeenCalled();
  });
});

describe('ChatOptionList focus', () => {
  it('does not take focus by default', () => {
    render(
      <ChatOptionList
        items={THREE}
        mode="radio"
        selected={[]}
        onPick={vi.fn()}
        ariaLabel="Pick"
      />,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it('does not steal focus from an editable field', () => {
    const { composer } = renderWithComposer({ items: THREE });
    expect(document.activeElement).toBe(composer);
  });

  it('does not steal focus when items arrive late', () => {
    const { composer, rerender } = renderWithComposer({ items: [] });
    rerender(<WithComposer items={THREE} />);
    expect(document.activeElement).toBe(composer);
  });

  it('focuses in the first commit that has items', () => {
    const { rerender } = render(<LateList items={[]} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<LateList items={THREE} />);
    expect(document.activeElement).toBe(
      screen.getByRole('option', { name: 'Gmail' }),
    );
  });
});

describe('ChatOptionList modes', () => {
  it('uses listbox and option for one choice', () => {
    renderList({ items: THREE });
    expect(screen.getByRole('listbox', { name: 'Pick' })).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('uses checkboxes in check mode and toggles them', () => {
    renderList({ items: THREE, mode: 'check' });
    expect(screen.getByRole('group', { name: 'Pick' })).toBeTruthy();
    const gmail = screen.getByRole('checkbox', { name: 'Gmail' });
    const yahoo = screen.getByRole('checkbox', { name: 'Yahoo' });
    fireEvent.click(gmail);
    fireEvent.click(yahoo);
    expect(gmail.getAttribute('aria-checked')).toBe('true');
    expect(yahoo.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(gmail);
    expect(gmail.getAttribute('aria-checked')).toBe('false');
  });

  it('renders plain buttons in action mode', () => {
    const { onPick } = renderList({ items: THREE, mode: 'action' });
    expect(screen.getByRole('group', { name: 'Pick' })).toBeTruthy();
    const outlook = screen.getByRole('button', { name: 'Outlook' });
    expect(outlook.hasAttribute('aria-checked')).toBe(false);
    expect(outlook.hasAttribute('aria-selected')).toBe(false);
    fireEvent.keyDown(outlook, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('outlook');
  });

  it('labels the write-your-own field and keeps it out of the listbox', () => {
    renderList({ items: THREE, withWriteYourOwn: true });
    const field = screen.getByRole('textbox', { name: 'Something else…' });
    expect(screen.getByRole('listbox').contains(field)).toBe(false);
  });
});

describe('ChatOptionGrid', () => {
  it('moves by one with Left and Right and by a row with Up and Down', () => {
    renderGrid({ items: makeItems(5) });
    const tile = (name: string) => screen.getByRole('option', { name });
    expect(document.activeElement).toBe(tile('Project 1'));

    fireEvent.keyDown(tile('Project 1'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tile('Project 2'));

    fireEvent.keyDown(tile('Project 2'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tile('Project 5'));

    fireEvent.keyDown(tile('Project 5'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tile('Project 5'));

    fireEvent.keyDown(tile('Project 5'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(tile('Project 2'));

    fireEvent.keyDown(tile('Project 2'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(tile('Project 1'));
  });

  it('selects a tile and keeps the field outside the listbox', () => {
    const { onPick } = renderGrid({ items: makeItems(3) });
    fireEvent.click(screen.getByRole('option', { name: 'Project 2' }));
    expect(onPick).toHaveBeenCalledWith('p2');
    expect(
      screen
        .getByRole('option', { name: 'Project 2' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    const field = screen.getByRole('textbox', { name: 'Something else…' });
    expect(screen.getByRole('listbox').contains(field)).toBe(false);
  });

  it('has no checked state in action mode', () => {
    renderGrid({ items: makeItems(3), mode: 'action' });
    const tile = screen.getByRole('button', { name: 'Project 1' });
    expect(tile.hasAttribute('aria-checked')).toBe(false);
  });
});

function renderList({
  items,
  mode = 'radio',
  numbered = false,
  withWriteYourOwn = false,
  autoFocus = true,
}: {
  items: ChatOptionItem[];
  mode?: ChatOptionMode;
  numbered?: boolean;
  withWriteYourOwn?: boolean;
  autoFocus?: boolean;
}) {
  const onPick = vi.fn();
  function Harness() {
    const [selected, setSelected] = useState<string[]>([]);
    const [answer, setAnswer] = useState('');
    return (
      <ChatOptionList
        items={items}
        mode={mode}
        selected={selected}
        onPick={(id) => {
          onPick(id);
          setSelected((current) => toggle({ mode, current, id }));
        }}
        ariaLabel="Pick"
        numbered={numbered}
        autoFocus={autoFocus}
        writeYourOwn={
          withWriteYourOwn
            ? {
                value: answer,
                onChange: setAnswer,
                onSubmit: vi.fn(),
                placeholder: 'Something else…',
              }
            : undefined
        }
      />
    );
  }
  render(<Harness />);
  return { onPick };
}

function renderGrid({
  items,
  mode = 'radio',
}: {
  items: ChatOptionItem[];
  mode?: ChatOptionMode;
}) {
  const onPick = vi.fn();
  function Harness() {
    const [selected, setSelected] = useState<string[]>([]);
    const [answer, setAnswer] = useState('');
    return (
      <ChatOptionGrid
        items={items}
        mode={mode}
        selected={selected}
        onPick={(id) => {
          onPick(id);
          setSelected([id]);
        }}
        ariaLabel="Pick"
        autoFocus
        writeYourOwn={{
          value: answer,
          onChange: setAnswer,
          onSubmit: vi.fn(),
          placeholder: 'Something else…',
        }}
      />
    );
  }
  render(<Harness />);
  return { onPick };
}

function renderWithComposer({ items }: { items: ChatOptionItem[] }) {
  const result = render(<WithComposer items={items} />);
  return {
    composer: screen.getByRole('textbox', { name: 'Composer' }),
    rerender: result.rerender,
  };
}

function WithComposer({ items }: { items: ChatOptionItem[] }) {
  return (
    <>
      <textarea aria-label="Composer" autoFocus />
      <ChatOptionList
        items={items}
        mode="radio"
        selected={[]}
        onPick={vi.fn()}
        ariaLabel="Pick"
        numbered
        autoFocus
      />
    </>
  );
}

function LateList({ items }: { items: ChatOptionItem[] }) {
  return (
    <ChatOptionList
      items={items}
      mode="radio"
      selected={[]}
      onPick={vi.fn()}
      ariaLabel="Pick"
      autoFocus
    />
  );
}

function toggle({
  mode,
  current,
  id,
}: {
  mode: ChatOptionMode;
  current: string[];
  id: string;
}): string[] {
  if (mode !== 'check') return [id];
  return current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];
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
