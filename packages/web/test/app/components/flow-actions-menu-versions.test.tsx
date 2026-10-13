/**
 * @vitest-environment jsdom
 * Regression: https://github.com/activepieces/activepieces/issues/13556
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({
  Copy: () => null,
  CornerUpLeft: () => null,
  Download: () => null,
  GalleryVerticalEnd: () => null,
  Import: () => null,
  Pencil: () => null,
  Share2: () => null,
  Trash2: () => null,
  UploadCloud: () => null,
  User: () => null,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children?: ReactNode }) => children,
  DropdownMenuContent: ({ children }: { children?: ReactNode }) => children,
  DropdownMenuItem: ({ children }: { children?: ReactNode }) => children,
  DropdownMenuTrigger: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/components/custom/delete-dialog', () => ({
  ConfirmationDeleteDialog: ({ children }: { children?: ReactNode }) =>
    children,
}));

vi.mock('@/components/custom/permission-needed-tooltip', () => ({
  PermissionNeededTooltip: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/components/custom/spinner', () => ({ LoadingSpinner: () => null }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: {
      isEmbedded: false,
      hideFolders: false,
      hideDuplicateFlow: false,
      hideExportAndImportFlow: false,
      disableNavigationInBuilder: false,
    },
  }),
}));

vi.mock('@/features/automations/components/move-to-folder-dialog', () => ({
  MoveToFolderDialog: () => null,
}));

vi.mock('@/features/automations/components/rename-dialog', () => ({
  RenameDialog: () => null,
}));

vi.mock('@/features/flows', () => ({
  flowHooks: { useExportFlows: () => ({ mutate: vi.fn(), isPending: false }) },
  flowsApi: { update: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/features/flows/components/change-owner-dialog', () => ({
  ChangeOwnerDialog: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/features/flows/components/import-flow-dialog', () => ({
  ImportFlowDialog: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/features/flows/components/share-template-dialog', () => ({
  ShareTemplateDialog: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/features/folders', () => ({
  foldersHooks: { useFolders: () => ({ folders: [] }) },
}));

vi.mock('@/features/members', () => ({
  projectMembersHooks: { useProjectMembers: () => ({ projectMembers: [] }) },
}));

vi.mock('@/features/project-releases', () => ({
  gitSyncHooks: { useGitSync: () => ({ gitSync: null }) },
}));

vi.mock('@/features/project-releases/components/published-tooltip', () => ({
  PublishedNeededTooltip: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/features/project-releases/components/push-to-git-dialog', () => ({
  PushToGitDialog: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { environmentsEnabled: false } },
    }),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

vi.mock('@/lib/navigation-utils', () => ({ useNewWindow: () => vi.fn() }));

// eslint-disable-next-line import/first
import FlowActionMenu from '@/app/components/flow-actions-menu';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildFlow(): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: 'flow-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: 'version-1',
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: now,
      updated: now,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: now,
      },
    },
  };
}

function menuTextFor({
  viewingRun,
  pathname,
}: {
  viewingRun: boolean;
  pathname: string;
}): string {
  const flow = buildFlow();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <MemoryRouter initialEntries={[pathname]}>
        <FlowActionMenu
          flow={flow}
          flowVersion={flow.version}
          readonly={false}
          insideBuilder={true}
          viewingRun={viewingRun}
          onVersionsListClick={() => undefined}
          onRename={() => undefined}
          onMoveTo={() => undefined}
          onDuplicate={() => undefined}
          onDelete={() => undefined}
        >
          <button>menu</button>
        </FlowActionMenu>
      </MemoryRouter>,
    );
  });
  return container.textContent ?? '';
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe('flow actions menu versions entry', () => {
  it('shows Versions in edit mode while the route still points at a run', () => {
    const text = menuTextFor({
      viewingRun: false,
      pathname: '/projects/project-1/runs/run-1',
    });

    expect(text).toContain('Versions');
  });

  it('hides Versions while a run is being viewed', () => {
    const text = menuTextFor({
      viewingRun: true,
      pathname: '/projects/project-1/runs/run-1',
    });

    expect(text).not.toContain('Versions');
  });
});
