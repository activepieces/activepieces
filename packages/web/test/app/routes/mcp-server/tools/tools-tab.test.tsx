/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

type WithChildren = { children?: React.ReactNode };

const server = vi.hoisted(() => {
  const state: { disabledTools: string[]; platformDisabledTools: string[] } = {
    disabledTools: [],
    platformDisabledTools: [],
  };
  return state;
});

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/components/project-settings/mcp-server/utils/mcp-hooks', () => ({
  mcpHooks: {
    useMcpServer: () => ({
      data: server,
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => undefined,
    }),
    useUpdateMcpServer: () => ({ mutate: () => undefined, isPending: false }),
  },
}));
vi.mock('@/app/components/project-settings/mcp-server/mcp-tools', () => ({
  McpTools: () => null,
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: false }) },
}));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: { usePieces: () => ({ pieces: undefined }) },
}));
vi.mock('@/app/routes/mcp-server/page-band', () => ({
  PageBand: ({ children }: WithChildren) => <div>{children}</div>,
}));
vi.mock('@/app/routes/mcp-server/project-picker', () => ({
  ProjectPicker: () => null,
}));
vi.mock('@/app/routes/mcp-server/pieces/pieces-panel', () => ({
  PiecesPanel: ({
    isRunActionDisabled,
    isRunActionDisabledByPlatform,
  }: {
    isRunActionDisabled: boolean;
    isRunActionDisabledByPlatform: boolean;
  }) => (
    <div
      data-run-action-off={String(isRunActionDisabled)}
      data-run-action-off-by-platform={String(isRunActionDisabledByPlatform)}
    />
  ),
}));

const { ToolsTab } = await import('@/app/routes/mcp-server/tools/tools-tab');

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const RUN_ACTION = 'ap_run_action';

function piecesPanelFor({
  disabledTools,
  platformDisabledTools,
}: {
  disabledTools: string[];
  platformDisabledTools: string[];
}): Element | null {
  server.disabledTools = disabledTools;
  server.platformDisabledTools = platformDisabledTools;
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => {
    root.render(
      <ToolsTab
        projectId="project-1"
        reachableProjectIds={null}
        segment="pieces"
        onSelectProject={() => undefined}
        onSelectSegment={() => undefined}
      />,
    );
  });
  return container.querySelector('[data-run-action-off]');
}

describe('ToolsTab, Run action on the Pieces segment', () => {
  it('blames the platform only when the platform switched Run action off', () => {
    const panel = piecesPanelFor({
      disabledTools: [RUN_ACTION],
      platformDisabledTools: [],
    });
    expect(panel?.getAttribute('data-run-action-off')).toBe('true');
    expect(panel?.getAttribute('data-run-action-off-by-platform')).toBe(
      'false',
    );
  });

  it('says the platform switched Run action off', () => {
    const panel = piecesPanelFor({
      disabledTools: [],
      platformDisabledTools: [RUN_ACTION],
    });
    expect(panel?.getAttribute('data-run-action-off')).toBe('false');
    expect(panel?.getAttribute('data-run-action-off-by-platform')).toBe('true');
  });
});
