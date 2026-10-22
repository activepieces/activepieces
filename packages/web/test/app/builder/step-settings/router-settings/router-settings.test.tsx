/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  BranchExecutionType,
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
  RouterAction,
  RouterExecutionType,
} from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

type BranchesListProps = {
  showFallbackBranch?: boolean;
  setSelectedBranchIndex: (index: number) => void;
  branchNameChanged: (index: number, name: string) => void;
};

const harness = vi.hoisted(() => ({
  branchesListProps: undefined as BranchesListProps | undefined,
  setSelectedBranchIndex: vi.fn(),
  fitView: vi.fn(),
  trigger: undefined as EmptyTrigger | undefined,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({ Split: () => null }));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView: harness.fitView }),
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (selector: (state: unknown) => unknown) =>
    selector({
      selectedStep: 'step_1',
      selectedBranchIndex: null,
      flowVersion: { trigger: harness.trigger },
      applyOperation: () => {},
      setSelectedBranchIndex: harness.setSelectedBranchIndex,
      addOperationListener: () => {},
      removeOperationListener: () => {},
    }),
}));

vi.mock('@/app/builder/flow-canvas/utils/flow-canvas-utils', () => ({
  flowCanvasUtils: { createFocusStepInGraphParams: () => ({}) },
}));

vi.mock('@/app/builder/step-settings/branch-settings', () => ({
  BranchSettings: () => null,
}));

vi.mock('@/app/builder/step-settings/router-settings/branches-list', () => ({
  BranchesList: (props: BranchesListProps) => {
    harness.branchesListProps = props;
    return null;
  },
}));

vi.mock('@/app/builder/step-settings/router-settings/branches-toolbar', () => ({
  default: () => null,
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
import { RouterSettings } from '@/app/builder/step-settings/router-settings';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type RouterFormShape = Omit<RouterAction, 'children' | 'nextAction'>;

const FALLBACK_INDEX = 1;

let container: HTMLDivElement;
let root: Root;

function buildStep(): RouterAction {
  return {
    name: 'step_1',
    displayName: 'Router',
    type: FlowActionType.ROUTER,
    valid: true,
    lastUpdatedDate: '2026-10-22T00:00:00.000Z',
    settings: {
      executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
      branches: [
        {
          branchType: BranchExecutionType.CONDITION,
          branchName: 'Branch 1',
          conditions: [[]],
        },
        {
          branchType: BranchExecutionType.FALLBACK,
          branchName: 'Otherwise',
        },
      ],
    },
    children: [null, null],
  };
}

let formApi: UseFormReturn<RouterFormShape> | undefined;

function Harness({ step }: { step: RouterFormShape }) {
  const form = useForm<RouterFormShape>({ defaultValues: step });
  formApi = form;
  return (
    <FormProvider {...form}>
      <RouterSettings readonly={false} />
    </FormProvider>
  );
}

function mountRouterSettings() {
  const step = buildStep();
  harness.trigger = {
    name: 'trigger',
    displayName: 'Trigger',
    type: FlowTriggerType.EMPTY,
    valid: false,
    lastUpdatedDate: '2026-10-22T00:00:00.000Z',
    settings: {},
    nextAction: step,
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const { children: _children, ...formStep } = step;
  act(() => {
    root.render(<Harness step={formStep} />);
  });
  if (!harness.branchesListProps) {
    throw new Error('branches list is not rendered');
  }
  return harness.branchesListProps;
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  harness.branchesListProps = undefined;
  formApi = undefined;
  vi.clearAllMocks();
});

describe('RouterSettings Otherwise branch', () => {
  it('lists the Otherwise branch so it can be renamed', () => {
    const props = mountRouterSettings();
    expect(props.showFallbackBranch).toBe(true);

    act(() => {
      props.branchNameChanged(FALLBACK_INDEX, 'Needs manual review');
    });

    expect(
      formApi?.getValues(`settings.branches.${FALLBACK_INDEX}.branchName`),
    ).toBe('Needs manual review');
  });

  it('focuses the Otherwise branch without opening a conditions editor', () => {
    mountRouterSettings().setSelectedBranchIndex(FALLBACK_INDEX);

    expect(harness.fitView).toHaveBeenCalledTimes(1);
    expect(harness.setSelectedBranchIndex).not.toHaveBeenCalled();
  });

  it('still opens the conditions editor for a condition branch', () => {
    mountRouterSettings().setSelectedBranchIndex(0);

    expect(harness.setSelectedBranchIndex).toHaveBeenCalledWith(0);
    expect(harness.fitView).toHaveBeenCalledTimes(1);
  });
});
