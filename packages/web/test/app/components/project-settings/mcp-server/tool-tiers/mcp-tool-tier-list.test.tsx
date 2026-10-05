/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { Permission } from '@activepieces/core-utils';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sheet = vi.hoisted(() => {
  const state: { latestProps: SheetCallbacks | null } = { latestProps: null };
  return state;
});

const debounce = vi.hoisted(() => {
  const state: { deferred: boolean } = { deferred: false };
  return state;
});

const authorization = vi.hoisted(() => {
  const grantedPermissions: string[] = [];
  return { grantedPermissions, useAuthorization: vi.fn() };
});

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) =>
      values && name in values ? String(values[name]) : match,
    ),
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: (projectId?: string) => {
    authorization.useAuthorization(projectId);
    return {
      checkAccess: (permission: string) =>
        authorization.grantedPermissions.includes(permission),
    };
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: false }) },
}));

vi.mock('use-debounce', async () => {
  const { useMemo, useRef } = await import('react');
  return {
    useDebouncedCallback: (fn: (tools: string[]) => void) => {
      const latest = useRef(fn);
      latest.current = fn;
      return useMemo(() => {
        const pending: { args: string[] | null } = { args: null };
        const debounced = (tools: string[]) => {
          if (debounce.deferred) {
            pending.args = tools;
            return;
          }
          latest.current(tools);
        };
        return Object.assign(debounced, {
          flush: () => {
            if (pending.args !== null) {
              latest.current(pending.args);
              pending.args = null;
            }
          },
        });
      }, []);
    },
  };
});

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: ChildrenProps) => <>{children}</>,
  TooltipTrigger: ({ children }: ChildrenProps) => <>{children}</>,
  TooltipContent: ({ children }: ChildrenProps) => <span>{children}</span>,
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: (props: SwitchMockProps) => (
    <input
      type="checkbox"
      data-switch={props['aria-label']}
      data-indeterminate={props.indeterminate ? 'true' : undefined}
      checked={props.checked === true}
      disabled={props.disabled === true}
      onChange={(event) => props.onCheckedChange?.(event.target.checked)}
    />
  ),
}));

vi.mock(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tools-sheet',
  () => ({
    McpToolsSheet: (props: SheetCallbacks) => {
      sheet.latestProps = props;
      return null;
    },
  }),
);

vi.mock('@/components/custom/confirm-dialog', () => ({
  ConfirmDialog: (props: DialogMockProps) =>
    props.open ? (
      <div data-dialog="true">
        <p>{props.description}</p>
        <button data-confirm="true" onClick={() => props.onConfirm()}>
          {props.confirmLabel}
        </button>
      </div>
    ) : null,
}));

const { McpToolTierList } = await import(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list'
);

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PROJECT_ID = 'project-1';
const DELETE_TOOLS = [
  'ap_delete_flow',
  'ap_delete_table',
  'ap_delete_records',
  'ap_manage_fields',
];
const READ_ONLY_NOTE =
  'You can see these tools, but your role cannot change them.';

let container: HTMLDivElement;
let root: Root;

function render({
  canWrite = true,
  ...props
}: Partial<ListProps> & { canWrite?: boolean } = {}) {
  authorization.grantedPermissions = canWrite
    ? [Permission.READ_MCP, Permission.WRITE_MCP]
    : [Permission.READ_MCP];
  act(() => {
    root.render(
      <McpToolTierList
        disabledTools={[]}
        scope="project"
        projectId={PROJECT_ID}
        onUpdateDisabledTools={() => undefined}
        {...props}
      />,
    );
  });
}

function tierSwitch(label: string): HTMLInputElement {
  const element = container.querySelector<HTMLInputElement>(
    `input[data-switch^="${label}"]`,
  );
  if (!element) {
    throw new Error(`no switch for ${label}`);
  }
  return element;
}

function toggle(label: string) {
  act(() => {
    tierSwitch(label).click();
  });
}

function confirm() {
  act(() => {
    container.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  authorization.useAuthorization.mockClear();
  debounce.deferred = false;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('McpToolTierList write gate', () => {
  it('checks write access against the project it edits', () => {
    render();

    expect(authorization.useAuthorization).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('has no switch for the always-on View tier', () => {
    render();

    expect(container.querySelector('input[data-switch^="View"]')).toBeNull();
    expect(container.textContent).toContain('Always on');
  });

  it('disables every switch and explains why when the role cannot write', () => {
    render({ canWrite: false });

    const switches = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[data-switch]'),
    );
    expect(switches.length).toBe(3);
    expect(switches.every((element) => element.disabled)).toBe(true);
    expect(container.textContent).toContain(READ_ONLY_NOTE);
  });

  it('does not save when a read-only role toggles a tool from the sheet', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ canWrite: false, onUpdateDisabledTools });

    act(() => {
      sheet.latestProps!.onToggleTool({
        name: 'ap_create_flow',
        enabled: false,
      });
      sheet.latestProps!.onSetAll({
        names: ['ap_create_flow'],
        enabled: false,
      });
    });

    expect(onUpdateDisabledTools).not.toHaveBeenCalled();
  });

  it('lets a platform admin edit whatever their role in the open project', () => {
    render({ canWrite: false, scope: 'platform' });

    expect(tierSwitch('Edit flows').disabled).toBe(false);
    expect(container.textContent).not.toContain(READ_ONLY_NOTE);
  });
});

describe('McpToolTierList saving', () => {
  it('turns a whole tier off in one save', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ onUpdateDisabledTools });

    toggle('Delete');

    expect(onUpdateDisabledTools).toHaveBeenCalledTimes(1);
    expect(onUpdateDisabledTools.mock.calls[0][0].tools.sort()).toEqual(
      [...DELETE_TOOLS].sort(),
    );
  });

  it('asks before turning Delete tools on, and saves only once confirmed', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ disabledTools: DELETE_TOOLS, onUpdateDisabledTools });

    toggle('Delete');

    expect(onUpdateDisabledTools).not.toHaveBeenCalled();
    confirm();
    expect(onUpdateDisabledTools).toHaveBeenCalledTimes(1);
    expect(onUpdateDisabledTools.mock.calls[0][0].tools).toEqual([]);
  });

  it('says the Delete confirmation applies to this project on a project page', () => {
    render({ disabledTools: DELETE_TOOLS });

    toggle('Delete');

    expect(container.querySelector('[data-dialog]')!.textContent).toContain(
      'in this project',
    );
  });

  it('says the Delete confirmation applies to every project on the platform page', () => {
    render({ disabledTools: DELETE_TOOLS, scope: 'platform' });

    toggle('Delete');

    expect(container.querySelector('[data-dialog]')!.textContent).toContain(
      'in every project',
    );
  });

  it('shows the saved value once a save settles, so a failure puts the switch back', () => {
    render({
      onUpdateDisabledTools: ({ onSettled }) => onSettled(),
    });

    toggle('Edit flows');

    expect(tierSwitch('Edit flows').checked).toBe(true);
  });

  it('keeps a newer change when an older save settles', () => {
    const settles: (() => void)[] = [];
    render({
      onUpdateDisabledTools: ({ onSettled }) => settles.push(onSettled),
    });

    toggle('Edit flows');
    toggle('Delete');
    act(() => settles[0]());

    expect(tierSwitch('Edit flows').checked).toBe(false);
    expect(tierSwitch('Delete').checked).toBe(false);
  });

  it('sends a save that was still waiting when the list unmounts', () => {
    debounce.deferred = true;
    const onUpdateDisabledTools = vi.fn();
    render({ onUpdateDisabledTools });

    toggle('Edit flows');
    expect(onUpdateDisabledTools).not.toHaveBeenCalled();
    act(() => root.unmount());

    expect(onUpdateDisabledTools).toHaveBeenCalledTimes(1);
    root = createRoot(container);
  });

  it('shows the middle state when only some of a tier is on', () => {
    render({ disabledTools: ['ap_delete_flow'] });

    expect(tierSwitch('Delete').dataset.indeterminate).toBe('true');
  });
});

describe('McpToolTierList, when the platform switched tools off', () => {
  it('locks a tier the platform turned off entirely', () => {
    render({ platformDisabledTools: DELETE_TOOLS });

    expect(tierSwitch('Delete').disabled).toBe(true);
    expect(tierSwitch('Delete').checked).toBe(false);
    expect(container.textContent).toContain('Off for the platform');
  });

  it('keeps a project-level disable of a platform-off tool when a tier is turned on', () => {
    const onUpdateDisabledTools = vi.fn();
    render({
      disabledTools: ['ap_delete_flow', 'ap_delete_table'],
      platformDisabledTools: ['ap_delete_flow'],
      onUpdateDisabledTools,
    });

    toggle('Delete');
    confirm();

    expect(onUpdateDisabledTools.mock.calls[0][0].tools).toEqual([
      'ap_delete_flow',
    ]);
  });

  it('does not copy platform-off tools into the project list when a tier is turned off', () => {
    const onUpdateDisabledTools = vi.fn();
    render({
      platformDisabledTools: ['ap_delete_flow'],
      onUpdateDisabledTools,
    });

    toggle('Delete');

    expect(onUpdateDisabledTools.mock.calls[0][0].tools.sort()).toEqual(
      ['ap_delete_records', 'ap_delete_table', 'ap_manage_fields'].sort(),
    );
  });
});

type ListProps = Parameters<typeof McpToolTierList>[0];

type ChildrenProps = { children: React.ReactNode };

type SheetCallbacks = {
  onToggleTool: (params: { name: string; enabled: boolean }) => void;
  onSetAll: (params: { names: string[]; enabled: boolean }) => void;
};

type SwitchMockProps = {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
};

type DialogMockProps = {
  open: boolean;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
};
