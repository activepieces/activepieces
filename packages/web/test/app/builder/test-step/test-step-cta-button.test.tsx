/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type RunnerMock = {
  fireTest: ReturnType<typeof vi.fn>;
  isTesting: boolean;
  canFireTest: boolean;
};

const triggerStep: Record<string, unknown> = {
  name: 'trigger',
  displayName: 'Web Form',
  type: 'PIECE_TRIGGER',
  valid: true,
  settings: {
    pieceName: '@activepieces/piece-forms',
    pieceVersion: '~0.4.21',
    triggerName: 'form_submission',
    input: {},
    sampleData: {},
  },
};

const testedTriggerStep: Record<string, unknown> = {
  ...triggerStep,
  settings: {
    pieceName: '@activepieces/piece-forms',
    pieceVersion: '~0.4.21',
    triggerName: 'form_submission',
    input: {},
    sampleData: { lastTestDate: '2026-09-11T00:00:00.000Z' },
  },
};

const codeStep: Record<string, unknown> = {
  name: 'step_1',
  displayName: 'Code',
  type: 'CODE',
  valid: true,
  settings: { sourceCode: { code: '', packageJson: '{}' }, input: {} },
};

const builderMock = vi.hoisted(
  (): {
    setStepDataPanelOpen: ReturnType<typeof vi.fn>;
    selectedStep: string;
    trigger: Record<string, unknown>;
  } => ({
    setStepDataPanelOpen: vi.fn(),
    selectedStep: 'trigger',
    trigger: {},
  }),
);

const runnerMock = vi.hoisted(
  (): { trigger: RunnerMock | null; action: RunnerMock | null } => ({
    trigger: null,
    action: null,
  }),
);

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: Record<string, unknown>) => unknown,
  ) =>
    selector({
      selectedStep: builderMock.selectedStep,
      flowVersion: { trigger: builderMock.trigger },
      isStepBeingTested: () => false,
      setStepDataPanelOpen: builderMock.setStepDataPanelOpen,
      run: null,
      saving: false,
    }),
}));

vi.mock('@/app/builder/test-step/test-runner-context', () => ({
  useTriggerTestRunner: () => runnerMock.trigger,
  useActionTestRunner: () => runnerMock.action,
}));

vi.mock('@/app/builder/test-step/test-step-tooltip', () => ({
  TestButtonTooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/features/pieces', () => ({
  pieceSelectorUtils: { isManualTrigger: () => false },
}));

import { TestStepCTAButton } from '@/app/builder/test-step/test-step-cta-button';

const idleRunner = (): RunnerMock => ({
  fireTest: vi.fn(),
  isTesting: false,
  canFireTest: true,
});

const busyRunner = (): RunnerMock => ({
  fireTest: vi.fn(),
  isTesting: true,
  canFireTest: false,
});

const selectTriggerStep = () => {
  builderMock.selectedStep = 'trigger';
  builderMock.trigger = triggerStep;
};

const selectCodeStep = () => {
  builderMock.selectedStep = 'step_1';
  builderMock.trigger = { ...triggerStep, nextAction: codeStep };
};

afterEach(() => {
  vi.clearAllMocks();
  runnerMock.trigger = null;
  runnerMock.action = null;
});

describe('TestStepCTAButton while a trigger test is running', () => {
  it('stays clickable and only reopens the test drawer', () => {
    selectTriggerStep();
    runnerMock.trigger = busyRunner();

    render(<TestStepCTAButton />);
    const button = screen.getByTestId('test-trigger-button');

    expect(button.matches(':disabled')).toBe(false);
    fireEvent.click(button);

    expect(builderMock.setStepDataPanelOpen).toHaveBeenCalledWith(true);
    expect(runnerMock.trigger.fireTest).not.toHaveBeenCalled();
  });

  it('opens the drawer and fires the test when idle', () => {
    selectTriggerStep();
    runnerMock.trigger = idleRunner();

    render(<TestStepCTAButton />);
    const button = screen.getByTestId('test-trigger-button');

    expect(button.matches(':disabled')).toBe(false);
    fireEvent.click(button);

    expect(builderMock.setStepDataPanelOpen).toHaveBeenCalledWith(true);
    expect(runnerMock.trigger.fireTest).toHaveBeenCalledTimes(1);
  });
});

describe('TestStepCTAButton while a retest is running', () => {
  it('keeps Show Data and a clickable in-progress button', () => {
    selectTriggerStep();
    builderMock.trigger = testedTriggerStep;
    runnerMock.trigger = busyRunner();

    render(<TestStepCTAButton />);
    const button = screen.getByTestId('test-trigger-button');

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(button.matches(':disabled')).toBe(false);
    fireEvent.click(button);

    expect(builderMock.setStepDataPanelOpen).toHaveBeenCalledWith(true);
    expect(runnerMock.trigger.fireTest).not.toHaveBeenCalled();
  });
});

describe('TestStepCTAButton while an action test is running', () => {
  it('stays clickable and only reopens the test drawer', () => {
    selectCodeStep();
    runnerMock.action = busyRunner();

    render(<TestStepCTAButton />);
    const button = screen.getByTestId('test-step-button');

    expect(button.matches(':disabled')).toBe(false);
    fireEvent.click(button);

    expect(builderMock.setStepDataPanelOpen).toHaveBeenCalledWith(true);
    expect(runnerMock.action.fireTest).not.toHaveBeenCalled();
  });
});
