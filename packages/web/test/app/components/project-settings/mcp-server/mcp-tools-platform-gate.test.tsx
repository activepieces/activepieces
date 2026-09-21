/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

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

const PLATFORM_OFF_TOOL = 'ap_delete_flow';
const PROJECT_OFF_TOOL = 'ap_create_flow';
const LOCKED_TOOL = 'ap_list_flows';

let container: HTMLDivElement;
let root: Root;

function render(props: Partial<Parameters<typeof McpTools>[0]> = {}) {
  act(() => {
    root.render(
      <McpTools
        disabledTools={[]}
        canWrite={true}
        isPending={false}
        onUpdateDisabledTools={() => undefined}
        {...props}
      />,
    );
  });
}

function checkboxFor(toolName: string): HTMLInputElement | null {
  return container.querySelector(`input[data-tool="${toolName}"]`);
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
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

  it('does not write the platform tool into the project list when a category is turned on', () => {
    const saved: string[][] = [];
    render({
      disabledTools: [PLATFORM_OFF_TOOL, PROJECT_OFF_TOOL],
      platformDisabledTools: [PLATFORM_OFF_TOOL],
      onUpdateDisabledTools: (tools: string[]) => saved.push(tools),
    });

    const categoryCheckbox = container.querySelector<HTMLInputElement>(
      'input[data-tool="category"]',
    );
    act(() => {
      categoryCheckbox!.click();
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]).toContain(PLATFORM_OFF_TOOL);
    expect(saved[0]).not.toContain(PROJECT_OFF_TOOL);
  });
});
