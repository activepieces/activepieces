/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { DictionaryInput } from '@/components/custom/dictionary-input';

const externalUpdate = {
  set: undefined as undefined | ((values: Record<string, string>) => void),
};

const Harness = ({ initial }: { initial: Record<string, string> }) => {
  const [values, setValues] = React.useState<Record<string, string>>(initial);
  externalUpdate.set = setValues;
  return (
    <DictionaryInput
      values={values}
      onChange={(event) => setValues(event.target.value)}
      keyPlaceholder="key"
      valuePlaceholder="value"
    />
  );
};

afterEach(() => {
  externalUpdate.set = undefined;
});

describe('DictionaryInput', () => {
  it('renders jsonb-ordered keys sorted alphabetically', () => {
    render(
      <Harness
        initial={{
          u_le_zip: '1',
          u_duedate: '2',
          u_le_city: '3',
          u_le_state: '4',
          u_agent_name: '5',
        }}
      />,
    );

    expect(keyInputValues()).toEqual([
      'u_agent_name',
      'u_duedate',
      'u_le_city',
      'u_le_state',
      'u_le_zip',
    ]);
  });

  it('keeps the row in place while its key is being edited', () => {
    render(<Harness initial={{ b: '1', m: '2' }} />);
    expect(keyInputValues()).toEqual(['b', 'm']);

    const editedInput =
      screen.getAllByPlaceholderText<HTMLInputElement>('key')[0];
    fireEvent.change(editedInput, { target: { value: 'z' } });

    expect(keyInputValues()).toEqual(['z', 'm']);
    expect(screen.getAllByPlaceholderText<HTMLInputElement>('key')[0]).toBe(
      editedInput,
    );
  });

  it('orders numeric, tied, case-variant, and empty keys deterministically', () => {
    render(
      <Harness
        initial={{
          '': '7',
          a1: '1',
          a01: '2',
          item10: '3',
          item2: '4',
          Zip: '5',
          zip: '6',
        }}
      />,
    );

    expect(keyInputValues()).toEqual([
      'a01',
      'a1',
      'item2',
      'item10',
      'zip',
      'Zip',
      '',
    ]);
  });

  it('keeps duplicate-prefix rows intact while typing a key', () => {
    render(<Harness initial={{ u_le: '1', b: '2' }} />);
    expect(keyInputValues()).toEqual(['b', 'u_le']);

    const editedInput =
      screen.getAllByPlaceholderText<HTMLInputElement>('key')[0];
    for (const partial of ['u', 'u_', 'u_l', 'u_le', 'u_le_c', 'u_le_city']) {
      fireEvent.change(editedInput, { target: { value: partial } });
      expect(
        screen.getAllByPlaceholderText<HTMLInputElement>('key'),
      ).toHaveLength(2);
      expect(screen.getAllByPlaceholderText<HTMLInputElement>('key')[0]).toBe(
        editedInput,
      );
    }

    expect(keyInputValues()).toEqual(['u_le_city', 'u_le']);
  });

  it('re-sorts when the value changes from outside', () => {
    render(<Harness initial={{ b: '1', m: '2' }} />);

    act(() => {
      externalUpdate.set?.({ z: '1', a: '2' });
    });

    expect(keyInputValues()).toEqual(['a', 'z']);
  });
});

function keyInputValues(): string[] {
  return screen
    .getAllByPlaceholderText<HTMLInputElement>('key')
    .map((input) => input.value);
}
