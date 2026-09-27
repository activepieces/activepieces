/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { Permission } from '@activepieces/core-utils';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authorization = vi.hoisted(() => {
  const grantedPermissions: string[] = [];
  return { grantedPermissions, useAuthorization: vi.fn() };
});

vi.mock('i18next', () => ({ t: (key: string) => key }));

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

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: (...args: any[]) => void) => fn,
}));

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-badge="true">{children}</span>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, disabled, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-tool={id ?? 'category'}
      data-state={checked === 'indeterminate' ? 'indeterminate' : undefined}
      checked={checked === true}
      disabled={disabled === true}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      readOnly
    />
  ),
}));

const { McpTools } = await import(
  '@/app/components/project-settings/mcp-server/mcp-tools'
);

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PROJECT_ID = 'project-1';
const PLATFORM_OFF_TOOL = 'ap_delete_flow';
const PROJECT_OFF_TOOL = 'ap_create_flow';
const LOCKED_TOOL = 'ap_list_flows';
const FLOW_MANAGEMENT_TOOLS = [
  'ap_create_flow',
  'ap_duplicate_flow',
  'ap_rename_flow',
  'ap_change_flow_status',
  'ap_delete_flow',
  'ap_lock_and_publish',
];
const READ_ONLY_NOTE =
  'You can see these tools, but your role cannot change them.';

let container: HTMLDivElement;
let root: Root;

function render({
  canWrite = true,
  ...props
}: Partial<Parameters<typeof McpTools>[0]> & { canWrite?: boolean } = {}) {
  authorization.grantedPermissions = canWrite
    ? [Permission.READ_MCP, Permission.WRITE_MCP]
    : [Permission.READ_MCP];
  act(() => {
    root.render(
      <McpTools
        disabledTools={[]}
        projectId={PROJECT_ID}
        isPending={false}
        onUpdateDisabledTools={() => undefined}
        {...props}
      />,
    );
  });
}

function checkboxes(): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="checkbox"]'));
}

function checkboxFor(toolName: string): HTMLInputElement | null {
  return container.querySelector(`input[data-tool="${toolName}"]`);
}

function flowManagementCheckbox(): HTMLInputElement {
  const element = container.querySelector<HTMLInputElement>(
    'input[data-tool="category"]',
  );
  if (!element) {
    throw new Error('no category checkbox');
  }
  return element;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  authorization.useAuthorization.mockClear();
});

describe('McpTools write gate', () => {
  it('checks write access against the project it edits', () => {
    render();

    expect(authorization.useAuthorization).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('leaves every checkbox editable when the role can write', () => {
    render();

    expect(checkboxes().length).toBeGreaterThan(0);
    expect(checkboxes().every((box) => box.disabled)).toBe(false);
  });

  it('disables every checkbox when the role cannot write', () => {
    render({ canWrite: false });

    expect(checkboxes().length).toBeGreaterThan(0);
    expect(checkboxes().every((box) => box.disabled)).toBe(true);
  });

  it('does not save when a read-only role toggles a tool', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ canWrite: false, onUpdateDisabledTools });

    act(() => {
      checkboxFor(PROJECT_OFF_TOOL)!.click();
    });

    expect(onUpdateDisabledTools).not.toHaveBeenCalled();
    expect(checkboxFor(PROJECT_OFF_TOOL)!.checked).toBe(true);
  });

  it('saves when a writing role toggles a tool', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ onUpdateDisabledTools });

    act(() => {
      checkboxFor(PROJECT_OFF_TOOL)!.click();
    });

    expect(onUpdateDisabledTools).toHaveBeenCalledWith([PROJECT_OFF_TOOL]);
  });

  it('tells a read-only role why the tools cannot change', () => {
    render({ canWrite: false });

    expect(container.textContent).toContain(READ_ONLY_NOTE);
  });

  it('stays silent about the role when it can write', () => {
    render();

    expect(container.textContent).not.toContain(READ_ONLY_NOTE);
  });
});

describe('McpTools, when the platform switched a tool off', () => {
  it('shows the tool as off and refuses to let anyone turn it on', () => {
    render({ platformDisabledTools: [PLATFORM_OFF_TOOL] });

    const checkbox = checkboxFor(PLATFORM_OFF_TOOL);
    expect(checkbox).not.toBeNull();
    expect(checkbox!.checked).toBe(false);
    expect(checkbox!.disabled).toBe(true);
  });

  it('says who switched it off, so nobody hunts for the project switch', () => {
    render({ platformDisabledTools: [PLATFORM_OFF_TOOL] });

    expect(container.textContent).toContain('Off for the whole platform');
  });

  it('leaves every other tool editable', () => {
    render({ platformDisabledTools: [PLATFORM_OFF_TOOL] });

    const checkbox = checkboxFor(PROJECT_OFF_TOOL);
    expect(checkbox!.disabled).toBe(false);
    expect(checkbox!.checked).toBe(true);
  });

  it('keeps a project-switched-off tool editable, so it can be turned back on', () => {
    render({ disabledTools: [PROJECT_OFF_TOOL] });

    const checkbox = checkboxFor(PROJECT_OFF_TOOL);
    expect(checkbox!.checked).toBe(false);
    expect(checkbox!.disabled).toBe(false);
  });

  it('never switches a locked tool off, whatever the platform list says', () => {
    render({ platformDisabledTools: [LOCKED_TOOL] });

    expect(checkboxFor(LOCKED_TOOL)).toBeNull();
    expect(container.textContent).toContain(LOCKED_TOOL);
  });

  it('shows the category as partly on, matching its count', () => {
    render({ platformDisabledTools: [PLATFORM_OFF_TOOL] });

    const category = flowManagementCheckbox();
    expect(category.checked).toBe(false);
    expect(category.getAttribute('data-state')).toBe('indeterminate');
    expect(container.textContent).toContain(
      `${FLOW_MANAGEMENT_TOOLS.length - 1}/${FLOW_MANAGEMENT_TOOLS.length}`,
    );
  });

  it('switches the editable tools off when all of them are on', () => {
    const saved: string[][] = [];
    render({
      platformDisabledTools: [PLATFORM_OFF_TOOL],
      onUpdateDisabledTools: (tools: string[]) => saved.push(tools),
    });

    act(() => {
      flowManagementCheckbox().click();
    });

    expect(saved).toHaveLength(1);
    expect([...saved[0]].sort()).toEqual(
      FLOW_MANAGEMENT_TOOLS.filter((name) => name !== PLATFORM_OFF_TOOL).sort(),
    );
  });

  it('does not write the platform tool into the project list when a category is turned on', () => {
    const saved: string[][] = [];
    render({
      disabledTools: [PLATFORM_OFF_TOOL, PROJECT_OFF_TOOL],
      platformDisabledTools: [PLATFORM_OFF_TOOL],
      onUpdateDisabledTools: (tools: string[]) => saved.push(tools),
    });

    act(() => {
      flowManagementCheckbox().click();
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]).toContain(PLATFORM_OFF_TOOL);
    expect(saved[0]).not.toContain(PROJECT_OFF_TOOL);
  });
});
