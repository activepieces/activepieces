/**
 * @vitest-environment jsdom
 */
import {
  PieceAuth,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  PackageType,
  PieceType,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { globalUpsert } = vi.hoisted(() => ({
  globalUpsert: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/connections/api/global-connections', () => ({
  globalConnectionsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    upsert: globalUpsert,
  },
}));

vi.mock('@/features/connections/api/app-connections', () => ({
  appConnectionsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    upsert: vi.fn(),
  },
}));

vi.mock('@/features/connections/hooks/oauth-apps-hooks', () => ({
  oauthAppsQueries: {
    usePiecesOAuth2AppsMap: () => ({ data: {}, isPending: false }),
  },
  oauthAppsMutations: {},
}));

vi.mock('@/features/projects/components/projects-selector', () => ({
  ProjectSelector: () => null,
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'project-1',
    getPlatformId: () => 'platform-1',
  },
}));

vi.mock('@/components/custom/markdown', () => ({
  ApMarkdown: () => null,
}));

vi.mock('@/app/connections/secret-input', () => ({
  SecretInput: ({
    name,
    value,
    onChange,
  }: {
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <input
      aria-label={name}
      name={name}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

import { CreateOrEditConnectionInline } from '@/app/connections/create-edit-connection-dialog';

const piece: PieceMetadataModelSummary = {
  name: '@activepieces/piece-test',
  displayName: 'Test',
  logoUrl: '',
  description: '',
  authors: [],
  version: '0.1.0',
  auth: PieceAuth.SecretText({ displayName: 'API Key', required: true }),
  actions: 0,
  triggers: 0,
  contextInfo: undefined,
  projectUsage: 0,
  pieceType: PieceType.OFFICIAL,
  packageType: PackageType.REGISTRY,
};

function globalConnection(
  preSelectForNewProjects: boolean,
): AppConnectionWithoutSensitiveData {
  return {
    id: 'conn-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    externalId: 'ext-1',
    displayName: 'Shared key',
    type: AppConnectionType.SECRET_TEXT,
    pieceName: piece.name,
    projectIds: ['project-1', 'project-2'],
    platformId: 'platform-1',
    scope: AppConnectionScope.PLATFORM,
    status: AppConnectionStatus.ERROR,
    ownerId: null,
    owner: null,
    metadata: null,
    flowIds: null,
    pieceVersion: '0.1.0',
    preSelectForNewProjects,
    usingSecretManager: false,
  };
}

function renderReconnect(
  reconnectConnection: AppConnectionWithoutSensitiveData,
) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CreateOrEditConnectionInline
        piece={piece}
        setOpen={() => {}}
        reconnectConnection={reconnectConnection}
        isGlobalConnection={true}
      />
    </QueryClientProvider>,
  );
}

describe('reconnecting a global connection', () => {
  beforeEach(() => {
    globalUpsert.mockReset();
  });

  it.each([true, false])(
    'keeps "Include by default in new projects" set to %s',
    async (preSelectForNewProjects) => {
      globalUpsert.mockResolvedValue(globalConnection(preSelectForNewProjects));
      renderReconnect(globalConnection(preSelectForNewProjects));
      fireEvent.change(
        screen.getByRole('textbox', { name: 'request.value.secret_text' }),
        { target: { value: 'new-secret' } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
      await waitFor(() => expect(globalUpsert).toHaveBeenCalledTimes(1));
      expect(globalUpsert.mock.calls[0][0]).toMatchObject({
        externalId: 'ext-1',
        projectIds: ['project-1', 'project-2'],
        preSelectForNewProjects,
        scope: AppConnectionScope.PLATFORM,
      });
    },
  );
});
