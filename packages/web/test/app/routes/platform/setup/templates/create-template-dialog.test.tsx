/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTemplateDialog } from '@/app/routes/platform/setup/templates/create-template-dialog';
import { readTemplateFile } from '@/app/routes/platform/setup/templates/read-template-file';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({
  create: vi.fn(),
  template: {
    displayName: 'Flow',
    valid: true,
    schemaVersion: null,
    trigger: {
      name: 'trigger',
      valid: false,
      displayName: 'Select Trigger',
      lastUpdatedDate: '2024-01-01T00:00:00.000Z',
      type: 'EMPTY',
      settings: {},
    },
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: undefined }) },
}));
vi.mock('@/features/templates', () => ({
  templatesApi: { create: (...args: unknown[]) => state.create(...args) },
}));
vi.mock('@/features/flows', () => ({
  templateUtils: { extractFlow: () => state.template },
}));

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <CreateTemplateDialog onDone={vi.fn()}>
          <button type="button">New template</button>
        </CreateTemplateDialog>
      </TooltipProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'New template' }));
}

function jsonFile() {
  const file = new File(['{}'], 'template.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve('{}'),
  });
  return file;
}

async function fillValidForm() {
  fireEvent.change(await screen.findByLabelText(/Name/), {
    target: { value: 'My template' },
  });
  fireEvent.change(screen.getByLabelText(/^Template/), {
    target: { files: [jsonFile()] },
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
}

const uncaught: unknown[] = [];
const onWindowError = (event: ErrorEvent) => uncaught.push(event.error);

beforeEach(() => {
  uncaught.length = 0;
  window.addEventListener('error', onWindowError);
});

afterEach(() => {
  window.removeEventListener('error', onWindowError);
});

describe('CreateTemplateDialog', () => {
  it('creates one template when Save is double-clicked', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    renderDialog();
    await fillValidForm();

    const save = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it('stays open while the template is saving', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    renderDialog();
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('shows a save failure inline and keeps the dialog open', async () => {
    state.create = vi.fn(() => Promise.reject(new Error('boom')));
    renderDialog();
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled'),
      ).toBe(false),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows a friendly message when no template file is chosen', async () => {
    state.create = vi.fn();
    renderDialog();
    fireEvent.change(await screen.findByLabelText(/Name/), {
      target: { value: 'My template' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Template is required')).toBeTruthy();
    expect(screen.queryByText(/Invalid input/)).toBeNull();
    expect(state.create).not.toHaveBeenCalled();
  });

  it('does not throw when the file chooser is cancelled', async () => {
    renderDialog();
    const input = await screen.findByLabelText(/^Template/);
    fireEvent.change(input, { target: { files: [jsonFile()] } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    fireEvent.change(input, { target: { files: [] } });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(uncaught).toEqual([]);
  });
});

describe('readTemplateFile', () => {
  it('clears the value when no file is chosen', () => {
    const onChange = vi.fn();
    const onInvalid = vi.fn();
    readTemplateFile({ file: undefined, onChange, onInvalid });
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(onInvalid).not.toHaveBeenCalled();
  });
});
