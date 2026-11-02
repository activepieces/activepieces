/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  SheetContent: ({ children }: ChildrenProps) => <div>{children}</div>,
  SheetHeader: ({ children }: ChildrenProps) => <div>{children}</div>,
  SheetTitle: ({ children }: ChildrenProps) => <h2>{children}</h2>,
  SheetDescription: ({ children }: ChildrenProps) => (
    <p data-description="true">{children}</p>
  ),
}));

vi.mock('@/components/custom/text-with-tooltip', () => ({
  TextWithTooltip: ({ children }: ChildrenProps) => <>{children}</>,
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: (props: SwitchMockProps) => (
    <input
      type="checkbox"
      data-switch={props['aria-label']}
      checked={props.checked === true}
      disabled={props.disabled === true}
      onChange={(event) => props.onCheckedChange?.(event.target.checked)}
    />
  ),
}));

const { McpToolsSheet } = await import(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tools-sheet'
);

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DELETE_TIER: McpToolTierGroup = {
  id: 'delete',
  locked: false,
  tools: [
    { name: 'ap_delete_flow', description: 'Delete a flow' },
    { name: 'ap_delete_table', description: 'Delete a table' },
  ],
};

let container: HTMLDivElement;
let root: Root;

function render(props: Partial<SheetProps> = {}) {
  act(() => {
    root.render(
      <McpToolsSheet
        tier={DELETE_TIER}
        onClose={() => undefined}
        offTools={[]}
        platformDisabledTools={[]}
        readOnly={false}
        onToggleTool={() => undefined}
        onSetAll={() => undefined}
        {...props}
      />,
    );
  });
}

function button(label: string): HTMLButtonElement | null {
  return (
    Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === label,
    ) ?? null
  );
}

function description(): string {
  return container.querySelector('[data-description]')!.textContent ?? '';
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('McpToolsSheet', () => {
  it('leads each tool with a readable name and keeps the code name beside it', () => {
    render();

    expect(container.textContent).toContain('Delete flow');
    expect(container.textContent).toContain('ap_delete_flow');
  });

  it('turns every tool off when all of them are on', () => {
    const onSetAll = vi.fn();
    render({ onSetAll });

    act(() => button('Turn all off')!.click());

    expect(onSetAll).toHaveBeenCalledWith({
      names: ['ap_delete_flow', 'ap_delete_table'],
      enabled: false,
    });
  });

  it('turns every tool on when any of them is off', () => {
    const onSetAll = vi.fn();
    render({ offTools: ['ap_delete_table'], onSetAll });

    act(() => button('Turn all on')!.click());

    expect(onSetAll).toHaveBeenCalledWith({
      names: ['ap_delete_flow', 'ap_delete_table'],
      enabled: true,
    });
  });

  it('locks a tool the platform turned off and leaves it out of Turn all', () => {
    const onSetAll = vi.fn();
    render({
      offTools: ['ap_delete_flow'],
      platformDisabledTools: ['ap_delete_flow'],
      onSetAll,
    });

    const locked = container.querySelector<HTMLInputElement>(
      'input[data-switch="Delete flow"]',
    )!;
    expect(locked.disabled).toBe(true);
    expect(container.textContent).toContain('Off for the platform');

    act(() => button('Turn all off')!.click());
    expect(onSetAll).toHaveBeenCalledWith({
      names: ['ap_delete_table'],
      enabled: false,
    });
  });

  it('says why nothing can change when every tool is off for the platform', () => {
    render({
      offTools: ['ap_delete_flow', 'ap_delete_table'],
      platformDisabledTools: ['ap_delete_flow', 'ap_delete_table'],
    });

    expect(description()).toBe(
      'A platform admin turned these off for every project.',
    );
    expect(button('Turn all on')).toBeNull();
  });

  it('explains a read-only role and hides Turn all', () => {
    render({ readOnly: true });

    expect(description()).toBe(
      'You can see these tools, but your role cannot change them.',
    );
    expect(button('Turn all off')).toBeNull();
    expect(
      Array.from(
        container.querySelectorAll<HTMLInputElement>('input[data-switch]'),
      ).every((element) => element.disabled),
    ).toBe(true);
  });
});

type SheetProps = Parameters<typeof McpToolsSheet>[0];

type McpToolTierGroup = NonNullable<SheetProps['tier']>;

type ChildrenProps = { children: React.ReactNode };

type SwitchMockProps = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
};
