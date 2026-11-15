/**
 * @vitest-environment jsdom
 *
 * The AI Router panel swaps between a master view (Input, Question, Match,
 * Routes, Confidence floor) and a detail view (one route's description). Both
 * views begin with a FormField, so unless the detail field carries a key React
 * keeps the same FormField instance and only swaps its `name`. react-hook-form's
 * useController then unregisters the previous name when the new one is not in
 * a field array (detail -> master deletes the description you just typed), and
 * seeds a missing value from the default it captured at mount (master -> detail
 * shows the Input text as the route's description).
 *
 * The component is rendered for real with a real react-hook-form. The builder
 * store, the canvas, the mentions editor and the routes list are stubbed; the
 * form fields render for real. This file uses raw react-dom + React's act
 * rather than @testing-library/react (not a dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  AiRouterAction,
  BranchExecutionType,
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
} from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

type BuilderStateStub = {
  selectedStep: string;
  selectedBranchIndex: number | null;
  flowVersion: { trigger: EmptyTrigger };
  applyOperation: () => void;
  setSelectedBranchIndex: () => void;
  addOperationListener: () => void;
  removeOperationListener: () => void;
};

const builder = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let state: BuilderStateStub | undefined;
  return {
    get: () => state,
    set: (next: BuilderStateStub | undefined) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({ Split: () => null }));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView: () => {} }),
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (selector: (state: BuilderStateStub) => unknown) => {
    const state = React.useSyncExternalStore(builder.subscribe, builder.get);
    if (!state) {
      throw new Error('builder state is not set');
    }
    return selector(state);
  },
}));

vi.mock('@/app/builder/flow-canvas/utils/flow-canvas-utils', () => ({
  flowCanvasUtils: { createFocusStepInGraphParams: () => ({}) },
}));

vi.mock('@/app/builder/piece-properties/text-input-with-mentions', () => ({
  TextInputWithMentions: ({ initialValue }: { initialValue?: string }) => (
    <input data-testid="mentions-input" defaultValue={initialValue ?? ''} />
  ),
}));

vi.mock('@/app/builder/step-settings/router-settings/branches-list', () => ({
  BranchesList: () => null,
}));

vi.mock('@/app/builder/step-settings/router-settings/branches-toolbar', () => ({
  default: () => null,
}));

vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: () => null,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SelectValue: () => null,
  SelectContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// eslint-disable-next-line import/first
import { AiRouterSettings } from '@/app/builder/step-settings/ai-router-settings';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type AiRouterFormShape = Omit<AiRouterAction, 'children' | 'nextAction'>;

const INPUT_TEXT = 'Hello from the trigger';
const TYPED_DESCRIPTION = 'Payments, invoices, refunds';

let container: HTMLDivElement;
let root: Root;
let formApi: UseFormReturn<AiRouterFormShape> | undefined;

function buildStep(
  firstRoute: AiRouterAction['settings']['branches'][number],
): AiRouterAction {
  return {
    name: 'step_1',
    displayName: 'AI Router',
    type: FlowActionType.AI_ROUTER,
    valid: true,
    lastUpdatedDate: '2026-09-22T00:00:00.000Z',
    settings: {
      text: INPUT_TEXT,
      question: 'What is this message about?',
      branches: [
        firstRoute,
        {
          branchType: BranchExecutionType.FALLBACK,
          branchName: 'Otherwise',
          description: 'Anything that fits none of the routes above',
        },
      ],
    },
    children: [null, null],
  };
}

function Harness({ step }: { step: AiRouterFormShape }) {
  const form = useForm<AiRouterFormShape>({
    defaultValues: step,
    mode: 'all',
  });
  formApi = form;
  return (
    <FormProvider {...form}>
      <AiRouterSettings readonly={false} />
    </FormProvider>
  );
}

function setup(step: AiRouterAction, selectedBranchIndex: number | null) {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    displayName: 'Trigger',
    type: FlowTriggerType.EMPTY,
    valid: false,
    lastUpdatedDate: '2026-09-22T00:00:00.000Z',
    settings: {},
    nextAction: step,
  };
  builder.set({
    selectedStep: step.name,
    selectedBranchIndex,
    flowVersion: { trigger },
    applyOperation: () => {},
    setSelectedBranchIndex: () => {},
    addOperationListener: () => {},
    removeOperationListener: () => {},
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const { children: _children, ...formStep } = step;
  act(() => {
    root.render(<Harness step={formStep} />);
  });
}

function showBranch(selectedBranchIndex: number | null) {
  const state = builder.get();
  if (!state) {
    throw new Error('builder state is not set');
  }
  act(() => {
    builder.set({ ...state, selectedBranchIndex });
  });
}

function descriptionTextarea(): HTMLTextAreaElement {
  const textarea = container.querySelector('textarea');
  if (!textarea) {
    throw new Error('route description textarea is not rendered');
  }
  return textarea;
}

async function typeIntoTextarea(textarea: HTMLTextAreaElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  if (!setValue) {
    throw new Error('textarea value setter is missing');
  }
  await act(async () => {
    setValue.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function savedDescription(index: number): unknown {
  return formApi?.getValues(`settings.branches.${index}.description`);
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  formApi = undefined;
  builder.set(undefined);
});

describe('AiRouterSettings route description', () => {
  it('keeps the description typed on a route after going back to the routes list', async () => {
    setup(
      buildStep({
        branchType: BranchExecutionType.CONDITION,
        branchName: 'Route 1',
        description: '',
      }),
      0,
    );

    await typeIntoTextarea(descriptionTextarea(), TYPED_DESCRIPTION);
    expect(savedDescription(0)).toBe(TYPED_DESCRIPTION);

    showBranch(null);

    expect(savedDescription(0)).toBe(TYPED_DESCRIPTION);
  });

  it('shows an empty description for a route that has none, not the Input text', () => {
    setup(
      buildStep({
        branchType: BranchExecutionType.CONDITION,
        branchName: 'Route 1',
        description: undefined,
      }),
      null,
    );

    showBranch(0);

    expect(descriptionTextarea().value).toBe('');
    expect(savedDescription(0)).not.toBe(INPUT_TEXT);
  });
});
