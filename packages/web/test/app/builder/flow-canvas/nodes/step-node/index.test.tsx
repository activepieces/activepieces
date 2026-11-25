/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowAction,
  FlowOperationStatus,
  FlowStatus,
  FlowTrigger,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { DndContext } from '@dnd-kit/core';
import { QueryClient } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { ApStepCanvasNode } from '@/app/builder/flow-canvas/nodes/step-node';
import { ApNodeType } from '@/app/builder/flow-canvas/utils/types';

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  Handle: () => null,
}));
vi.mock('@/features/pieces', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/pieces')>()),
  stepsHooks: { useStepMetadata: () => ({ stepMetadata: undefined }) },
}));
vi.mock('@/app/builder/pieces-selector', () => ({
  PieceSelector: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/app/builder/run-details/loop-iteration-input', () => ({
  LoopIterationInput: () => null,
}));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildFlow(): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: 'flow-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: now,
      updated: now,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Select Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: now,
        nextAction: {
          name: 'step_1',
          valid: true,
          displayName: 'Step 1',
          type: 'CODE',
          settings: {},
          skip: false,
        },
      },
    },
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function renderNode({
  readonly,
  stepName,
}: {
  readonly: boolean;
  stepName: 'trigger' | 'step_1';
}) {
  const flow = buildFlow();
  const store: BuilderStore = createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io('http://localhost', { autoConnect: false }),
    queryClient: new QueryClient(),
  });
  const trigger: FlowTrigger = flow.version.trigger;
  const step: FlowTrigger | FlowAction =
    stepName === 'trigger' ? trigger : trigger.nextAction;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const mountedRoot = root;
  await act(async () => {
    mountedRoot.render(
      <DndContext>
        <BuilderStateContext.Provider value={store}>
          <ApStepCanvasNode
            id={step.name}
            type={ApNodeType.STEP}
            data={{ step }}
            selected={false}
            isConnectable={false}
            zIndex={0}
            positionAbsoluteX={0}
            positionAbsoluteY={0}
            dragging={false}
          />
        </BuilderStateContext.Provider>
      </DndContext>,
    );
  });
  const node = container.querySelector<HTMLElement>(
    `[data-step-context-menu="${step.name}"]`,
  );
  if (!node) {
    throw new Error(`step node ${step.name} not rendered`);
  }
  const attributes = Object.fromEntries(
    Array.from(node.attributes, (attribute) => [
      attribute.name,
      attribute.value,
    ]),
  );
  return { node, attributes, store };
}

describe('flow canvas step node accessibility (GIT-1802)', () => {
  afterEach(async () => {
    const mountedRoot = root;
    if (mountedRoot) {
      await act(async () => {
        mountedRoot.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
  });

  it.each([
    {
      label: 'draggable action node in the editor',
      readonly: false,
      stepName: 'step_1',
    },
    {
      label: 'trigger node in the editor',
      readonly: false,
      stepName: 'trigger',
    },
    {
      label: 'action node in a read-only run',
      readonly: true,
      stepName: 'step_1',
    },
    {
      label: 'trigger node in a read-only run',
      readonly: true,
      stepName: 'trigger',
    },
  ] as const)(
    'reports the $label as an enabled button that opens the step',
    async ({ readonly, stepName }) => {
      const { node, attributes, store } = await renderNode({
        readonly,
        stepName,
      });
      expect(attributes).toMatchObject({ role: 'button', tabindex: '0' });
      expect(attributes).not.toHaveProperty('aria-disabled');
      await act(async () => {
        node.click();
      });
      expect(store.getState().selectedStep).toBe(stepName);
    },
  );
});
