/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  AgentFlowTool,
  AgentTool,
  AgentToolType,
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const available = vi.hoisted(() => ({ flows: [] as PopulatedFlow[] }));

vi.mock('@/features/agents/hooks/agent-hooks', () => ({
  agentQueries: {
    useFlowsForAgent: () => ({ data: { data: available.flows } }),
  },
}));

vi.mock('@/features/pieces/components/piece-icon-list', () => ({
  PieceIconList: () => null,
}));

vi.mock(
  '@/features/agents/agent-tools/flow-tool-dialog/create-mcp-flow-button',
  () => ({ CreateMcpFlowButton: () => null }),
);

vi.mock('i18next', () => ({ t: (key: string) => key }));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { AgentFlowToolDialog } from '@/features/agents/agent-tools/flow-tool-dialog';
import { useFlowToolDialogStore } from '@/features/agents/agent-tools/stores/flows-tools';

let container: HTMLDivElement;
let root: Root;

function buildFlow(name: string): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: name,
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: name,
    ownerId: null,
    folderId: null,
    status: FlowStatus.ENABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: `${name}-version`,
      created: now,
      updated: now,
      flowId: name,
      displayName: name,
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.LOCKED,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.PIECE,
        settings: {
          pieceName: '@activepieces/piece-mcp',
          pieceVersion: '0.0.1',
          triggerName: 'mcp_tool',
          input: {},
          propertySettings: {},
        },
        lastUpdatedDate: now,
      },
    },
  };
}

function flowTool(name: string): AgentFlowTool {
  return {
    type: AgentToolType.FLOW,
    externalFlowId: name,
    toolName: name,
    flowDisplayName: name,
  };
}

function render({
  tools,
  onToolsUpdate,
}: {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
}) {
  act(() => {
    root.render(
      <AgentFlowToolDialog tools={tools} onToolsUpdate={onToolsUpdate} />,
    );
  });
}

function setOpen(open: boolean) {
  act(() => {
    useFlowToolDialogStore.getState().setShowAddFlowDialog(open);
  });
}

function click(text: string) {
  const target = Array.from(
    document.body.querySelectorAll<HTMLElement>('button, div'),
  )
    .filter((element) => element.textContent?.trim() === text)
    .at(-1);
  if (!target) {
    throw new Error(`nothing to click with text "${text}"`);
  }
  act(() => {
    target.click();
  });
}

function savedFlowIds(onToolsUpdate: ReturnType<typeof vi.fn>): string[] {
  const [tools] = onToolsUpdate.mock.lastCall ?? [[]];
  return tools
    .filter((tool: AgentTool) => tool.type === AgentToolType.FLOW)
    .map((tool: AgentFlowTool) => tool.externalFlowId);
}

beforeEach(() => {
  available.flows = ['F1', 'F2', 'F3'].map(buildFlow);
  useFlowToolDialogStore.setState({ showAddFlowDialog: false });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('adding flow tools to an agent', () => {
  it('keeps a removed flow tool removed when another flow is added', () => {
    const onToolsUpdate = vi.fn();
    render({ tools: [flowTool('F1'), flowTool('F2')], onToolsUpdate });
    setOpen(true);
    setOpen(false);

    render({ tools: [flowTool('F1')], onToolsUpdate });
    setOpen(true);
    click('F3');
    click('Save');

    expect(savedFlowIds(onToolsUpdate)).toEqual(['F1', 'F3']);
  });

  it('drops flows ticked before the dialog was closed without saving', () => {
    const onToolsUpdate = vi.fn();
    render({ tools: [flowTool('F1')], onToolsUpdate });
    setOpen(true);
    click('F3');
    click('Close');

    setOpen(true);
    click('Save');

    expect(savedFlowIds(onToolsUpdate)).toEqual(['F1']);
  });
});
