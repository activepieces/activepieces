/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

type WithChildren = { children?: React.ReactNode };

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: WithChildren) => <div>{children}</div>,
  PopoverTrigger: ({ children }: WithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: WithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: WithChildren) => <div>{children}</div>,
  CommandInput: () => null,
  CommandList: ({ children }: WithChildren) => <div>{children}</div>,
  CommandEmpty: () => null,
  CommandGroup: ({ children }: WithChildren) => <div>{children}</div>,
  CommandItem: ({ children }: WithChildren) => (
    <div data-project-item="true">{children}</div>
  ),
}));
vi.mock('@/features/projects', () => ({
  ApProjectDisplay: ({ title }: { title: string }) => <span>{title}</span>,
  getProjectName: ({ displayName }: { displayName: string }) => displayName,
  projectCollectionUtils: {
    useAll: () => ({
      data: [
        { id: 'reachable', displayName: 'Reachable' },
        { id: 'unreachable', displayName: 'Unreachable' },
      ],
    }),
  },
}));

const { ProjectPicker } = await import(
  '@/app/routes/mcp-server/project-picker'
);

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function offeredProjects(
  allowedProjectIds: string[] | null,
): Array<string | null> {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => {
    root.render(
      <ProjectPicker
        projectId="reachable"
        allowedProjectIds={allowedProjectIds}
        onSelect={() => undefined}
      />,
    );
  });
  return Array.from(
    container.querySelectorAll('[data-project-item="true"]'),
  ).map((item) => item.textContent);
}

describe('ProjectPicker', () => {
  it('offers only the projects MCP reaches', () => {
    expect(offeredProjects(['reachable'])).toEqual(['Reachable']);
  });

  it('offers every project when MCP reaches all of them', () => {
    expect(offeredProjects(null)).toEqual(['Reachable', 'Unreachable']);
  });
});
