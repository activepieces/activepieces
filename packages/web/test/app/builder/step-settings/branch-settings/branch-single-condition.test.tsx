/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13900
 *
 * Selecting a single-value operator (Exists / Does not exist / Boolean is
 * true|false / List is empty|not empty) must hide the "Second value" field
 * immediately. It used to stay mounted until a page refresh because the
 * component read the condition with a non-subscribing form.getValues()
 * snapshot, so isSingleValueCondition never recomputed on operator change.
 *
 * The component is rendered for real with a real react-hook-form. Only
 * SearchableSelect and TextInputWithMentions are stubbed, the first so the
 * test can invoke the component's real onChange exactly as picking an option
 * would, the second because the mentions editor is a tiptap instance. Every
 * other child renders for real, including the InvalidStepIcon whose visibility
 * is one of the flags this bug affected. This file uses raw react-dom + React's
 * act rather than @testing-library/react (not a dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { BranchOperator } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => ({
  onChange: undefined as undefined | ((value: string | null) => void),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string | null) => void;
  }) => {
    selectMock.onChange = onChange;
    return <div data-testid="operator-select" data-value={value} />;
  },
}));

vi.mock('@/app/builder/piece-properties/text-input-with-mentions', () => ({
  TextInputWithMentions: () => <input data-testid="mentions-input" />,
}));

// eslint-disable-next-line import/first
import { BranchSingleCondition } from '@/app/builder/step-settings/branch-settings/branch-single-condition';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type ConditionFormShape = {
  settings: {
    branches: {
      conditions: {
        operator: BranchOperator;
        firstValue: string;
        secondValue?: string;
      }[][];
    }[];
  };
};

let container: HTMLDivElement;
let root: Root;
let formApi: UseFormReturn<ConditionFormShape> | undefined;

function Harness({
  operator,
  secondValue = '',
}: {
  operator: BranchOperator;
  secondValue?: string;
}) {
  const form = useForm<ConditionFormShape>({
    defaultValues: {
      settings: {
        branches: [
          { conditions: [[{ operator, firstValue: '', secondValue }]] },
        ],
      },
    },
    mode: 'all',
  });
  formApi = form;
  return (
    <FormProvider {...form}>
      <BranchSingleCondition
        branchIndex={0}
        groupIndex={0}
        conditionIndex={0}
        showDelete={false}
        readonly={false}
        deleteClick={() => {}}
      />
    </FormProvider>
  );
}

function setup(operator: BranchOperator, secondValue?: string) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness operator={operator} secondValue={secondValue} />);
  });
}

function selectOperator(operator: BranchOperator) {
  act(() => {
    selectMock.onChange?.(operator);
  });
}

function hasSecondValueField(): boolean {
  return Array.from(container.querySelectorAll('label')).some(
    (label) => label.textContent === 'Second value',
  );
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  selectMock.onChange = undefined;
  formApi = undefined;
});

describe('BranchSingleCondition (issue 13900)', () => {
  it('shows the Second value field for a two-value operator', () => {
    setup(BranchOperator.NUMBER_IS_EQUAL_TO);

    expect(hasSecondValueField()).toBe(true);
  });

  it('hides the Second value field immediately when switching to a single-value operator', () => {
    setup(BranchOperator.NUMBER_IS_EQUAL_TO);
    expect(hasSecondValueField()).toBe(true);

    selectOperator(BranchOperator.EXISTS);

    expect(hasSecondValueField()).toBe(false);
  });

  it('restores the Second value field when switching back to a two-value operator, and clears the value it was hiding', () => {
    setup(BranchOperator.EXISTS, 'stale');
    expect(hasSecondValueField()).toBe(false);

    selectOperator(BranchOperator.TEXT_EXACTLY_MATCHES);

    expect(hasSecondValueField()).toBe(true);
    expect(
      formApi?.getValues('settings.branches.0.conditions.0.0.secondValue'),
    ).toBe('');
  });
});
