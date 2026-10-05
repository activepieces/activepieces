/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { ChipListField, SaveBar } from '@/components/custom/settings-parts';

const saveBar = (props: Partial<React.ComponentProps<typeof SaveBar>> = {}) =>
  render(
    <form>
      <SaveBar dirty={true} saving={false} onDiscard={vi.fn()} {...props} />
    </form>,
  );

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SaveBar', () => {
  it('renders nothing when clean and without an error', () => {
    saveBar({ dirty: false });

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
  });

  it('shows the unsaved changes prompt with Discard and Save', () => {
    saveBar();

    expect(screen.getByText('You have unsaved changes')).toBeDefined();
    expect(button('Discard').type).toBe('button');
    expect(button('Save').type).toBe('submit');
  });

  it('uses the custom save label', () => {
    saveBar({ saveLabel: 'Publish' });

    expect(button('Publish')).toBeDefined();
  });

  it('shows the error in place of the prompt, even when clean', () => {
    saveBar({ dirty: false, error: 'Name is taken' });

    expect(screen.getByRole('alert')).toBe(screen.getByText('Name is taken'));
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
    expect(button('Save')).toBeDefined();
  });

  it('disables Save while the form is invalid', () => {
    saveBar({ invalid: true });

    expect(button('Save').disabled).toBe(true);
    expect(button('Discard').disabled).toBe(false);
  });

  it('disables Discard while saving', () => {
    saveBar({ saving: true });

    expect(button('Discard').disabled).toBe(true);
  });

  it('calls onDiscard', () => {
    const onDiscard = vi.fn();
    saveBar({ onDiscard });

    fireEvent.click(button('Discard'));

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  describe('locked', () => {
    const lock = {
      message: 'Previewing an Enterprise feature',
      upgradeAction: <button type="button">Upgrade to save</button>,
    };

    it('shows the preview message and the upgrade action instead of Save', () => {
      saveBar({ locked: lock });

      expect(screen.getByText(lock.message)).toBeDefined();
      expect(button('Upgrade to save')).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
      expect(screen.queryByText('You have unsaved changes')).toBeNull();
    });

    it('lets Discard reset the preview', () => {
      const onDiscard = vi.fn();
      saveBar({ locked: lock, onDiscard });

      fireEvent.click(button('Discard'));

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when the preview is clean', () => {
      saveBar({ locked: lock, dirty: false });

      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.queryByText(lock.message)).toBeNull();
    });
  });
});

describe('ChipListField', () => {
  const field = (onAdd: (value: string) => Promise<unknown> | void) =>
    render(
      <ChipListField
        values={['acme.com']}
        onAdd={onAdd}
        onRemove={vi.fn()}
        placeholder="Domain"
        emptyLabel="None yet"
      />,
    );

  const type = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('Domain'), {
      target: { value },
    });

  const input = () => screen.getByPlaceholderText('Domain') as HTMLInputElement;

  it('clears the input only after onAdd resolves', async () => {
    let resolve!: () => void;
    const onAdd = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );
    field(onAdd);
    type('example.com');

    fireEvent.click(button('Add'));

    expect(onAdd).toHaveBeenCalledWith('example.com');
    expect(input().value).toBe('example.com');

    await act(async () => resolve());

    expect(input().value).toBe('');
  });

  it('keeps the input when onAdd rejects', async () => {
    field(() => Promise.reject(new Error('Not allowed')));
    type('example.com');

    fireEvent.click(button('Add'));

    await waitFor(() => expect(button('Add').disabled).toBe(false));
    expect(input().value).toBe('example.com');
  });

  it('does not call onAdd for a duplicate', () => {
    const onAdd = vi.fn();
    field(onAdd);
    type('acme.com');

    fireEvent.click(button('Add'));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText('Already in the list')).toBeDefined();
  });
});
