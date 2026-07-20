// @vitest-environment jsdom
import { isValidElement, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// The route tree transitively pulls in the tables feature, whose RevoGrid grid
// imports raw `.css` that Vitest can't load through Node's ESM resolver. We only
// assert on route SHAPE here, so stub the barrel to keep the import light.
vi.mock('@/features/tables', () => ({
  ApTableStateProvider: ({ children }: { children: ReactNode }) => children,
}));

import { browserRoutes, embedRoutes } from '@/app/guards';
import { WorkspaceShell } from '@/app/components/workspace-shell';
import { EmbedShell } from '@/app/components/workspace-shell/embed-shell';

// These assertions lock in the embed-isolation invariant: the embedded app (iframe)
// renders a chrome-free EmbedShell and never the operator WorkspaceShell or the /chat
// landing. If a future change wires operator chrome into the embed tree — or adds a
// /chat route to it — this fails in CI. Keep embed an OPT-IN surface, not a
// subtract-chrome-by-flag shell. See app/components/workspace-shell/embed-shell.tsx.

function collectPaths(routes: RouteObject[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...(route.children ? collectPaths(route.children) : []),
  ]);
}

function elementContainsComponent(node: ReactNode, Component: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some((child) => elementContainsComponent(child, Component));
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return false;
  }
  if (node.type === Component) {
    return true;
  }
  return elementContainsComponent(node.props.children, Component);
}

function findShellRoute(routes: RouteObject[]): RouteObject | undefined {
  return routes.find((route) =>
    route.children?.some((child) => child.path === '/projects/:projectId'),
  );
}

describe('embed route isolation', () => {
  it('keeps the /chat landing out of the embed tree but in the operator tree', () => {
    expect(collectPaths(embedRoutes)).not.toContain('/chat');
    expect(collectPaths(browserRoutes)).toContain('/chat');
  });

  it('mounts EmbedShell (not the operator WorkspaceShell) for embeds', () => {
    const embedShell = findShellRoute(embedRoutes);
    expect(embedShell).toBeDefined();
    expect(elementContainsComponent(embedShell?.element, EmbedShell)).toBe(true);
    expect(elementContainsComponent(embedShell?.element, WorkspaceShell)).toBe(
      false,
    );
  });

  it('mounts WorkspaceShell for the operator app', () => {
    const operatorShell = findShellRoute(browserRoutes);
    expect(operatorShell).toBeDefined();
    expect(
      elementContainsComponent(operatorShell?.element, WorkspaceShell),
    ).toBe(true);
    expect(elementContainsComponent(operatorShell?.element, EmbedShell)).toBe(
      false,
    );
  });

  it('still exposes the shared project surfaces in both trees', () => {
    expect(collectPaths(embedRoutes)).toContain('/projects/:projectId');
    expect(collectPaths(browserRoutes)).toContain('/projects/:projectId');
  });
});
