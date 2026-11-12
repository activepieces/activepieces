import { isObject } from '@activepieces/core-utils';
import { useMatches } from 'react-router-dom';

function useShellMatch(): { handle: RouteHandle; templateId?: string } {
  const matches = useMatches();
  const match = matches.findLast((m) => isRouteHandle(m.handle));
  const handle: RouteHandle = isRouteHandle(match?.handle)
    ? match.handle
    : shellHandles.project;
  return {
    handle,
    templateId:
      handle.standalone === 'sharedTemplate'
        ? match?.params.templateId
        : undefined,
  };
}

function useShellHandle(): RouteHandle {
  return useShellMatch().handle;
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return isObject(value) && SHELLS.some((shell) => shell === value.shell);
}

const SHELLS = ['project', 'builder', 'platform'] as const;

const shellHandles = {
  project: { shell: 'project' },
  projectWithHeader: { shell: 'project', projectHeader: true },
  publicProject: { shell: 'project', allowAnonymous: true },
  projectRedirect: { shell: 'project', redirectOnly: true },
  publicRedirect: {
    shell: 'project',
    allowAnonymous: true,
    redirectOnly: true,
  },
  templateDetails: {
    shell: 'project',
    allowAnonymous: true,
    standalone: 'sharedTemplate',
  },
  builder: { shell: 'builder' },
  platform: { shell: 'platform' },
} satisfies Record<string, RouteHandle>;

export { useShellMatch, useShellHandle, shellHandles };

export type RouteHandle = {
  shell: (typeof SHELLS)[number];
  projectHeader?: true;
  allowAnonymous?: true;
  standalone?: 'sharedTemplate';
  redirectOnly?: true;
};
