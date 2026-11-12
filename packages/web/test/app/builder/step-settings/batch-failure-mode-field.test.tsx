/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { ProcessInBatchesAction } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { BatchFailureModeField } from '@/app/builder/step-settings/batch-failure-mode-field';

const captured = vi.hoisted(() => ({
  form: null as UseFormReturn<ProcessInBatchesAction> | null,
}));

const Harness = () => {
  const form = useForm<ProcessInBatchesAction>({
    defaultValues: {
      settings: {
        errorHandlingOptions: { continueOnFailure: { value: false } },
      },
    },
  });
  captured.form = form;
  return (
    <FormProvider {...form}>
      <BatchFailureModeField readonly={false} />
    </FormProvider>
  );
};

const CONTINUE_ON_FAILURE =
  'settings.errorHandlingOptions.continueOnFailure.value';

describe('BatchFailureModeField', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    captured.form = null;
  });

  function radio({ name }: { name: string }): HTMLElement {
    const match = Array.from(
      container.querySelectorAll<HTMLElement>('[role="radio"]'),
    ).find((element) => element.textContent === name);
    if (!match) {
      throw new Error(`No radio named ${name}`);
    }
    return match;
  }

  it('writes continueOnFailure for each option', () => {
    act(() => root.render(<Harness />));
    expect(radio({ name: 'Stop the step' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    act(() => radio({ name: 'Continue & report' }).click());
    expect(captured.form?.getValues(CONTINUE_ON_FAILURE)).toBe(true);
    expect(
      radio({ name: 'Continue & report' }).getAttribute('aria-checked'),
    ).toBe('true');

    act(() => radio({ name: 'Stop the step' }).click());
    expect(captured.form?.getValues(CONTINUE_ON_FAILURE)).toBe(false);
  });

  it('names the radio group with its visible label', () => {
    act(() => root.render(<Harness />));
    const group = container.querySelector('[role="radiogroup"]');
    const labelId = group?.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(labelId)?.textContent).toBe(
      'If a batch fails',
    );
  });
});
