/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
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

const EDITABLE_TOOL = 'ap_create_flow';

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

function checkboxes(): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="checkbox"]'));
}

function toolCheckbox(name: string): HTMLInputElement {
  const element = container.querySelector<HTMLInputElement>(
    `[data-tool="${name}"]`,
  );
  if (!element) {
    throw new Error(`no checkbox for ${name}`);
  }
  return element;
}

describe('McpTools write gate', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('leaves every checkbox editable when the role can write', () => {
    render({ canWrite: true });

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
      toolCheckbox(EDITABLE_TOOL).click();
    });

    expect(onUpdateDisabledTools).not.toHaveBeenCalled();
    expect(toolCheckbox(EDITABLE_TOOL).checked).toBe(true);
  });

  it('saves when a writing role toggles a tool', () => {
    const onUpdateDisabledTools = vi.fn();
    render({ canWrite: true, onUpdateDisabledTools });

    act(() => {
      toolCheckbox(EDITABLE_TOOL).click();
    });

    expect(onUpdateDisabledTools).toHaveBeenCalledWith([EDITABLE_TOOL]);
  });

  it('tells a read-only role why the tools cannot change', () => {
    render({ canWrite: false });

    expect(container.textContent).toContain(
      'You can see these tools, but your role cannot change them.',
    );
  });

  it('stays silent about the role when it can write', () => {
    render({ canWrite: true });

    expect(container.textContent).not.toContain(
      'You can see these tools, but your role cannot change them.',
    );
  });
});
