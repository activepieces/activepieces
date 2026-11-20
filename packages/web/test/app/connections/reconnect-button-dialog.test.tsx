// @vitest-environment jsdom
import {
  PieceAuth,
  PieceMetadataModel,
  Property,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));
vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: { useCurrentPlatform: () => ({ platform: { plan: {} } }) },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project_1' },
}));
vi.mock('@/features/pieces/stores/piece-selector-tabs-provider', () => ({
  PieceSelectorTabType: {},
  usePieceSelectorTabs: () => ({
    selectedTab: undefined,
    selectedCustomTabId: undefined,
  }),
}));

const get = vi.fn();
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: {
    get: (request: { name: string; version?: string }) => get(request),
  },
}));
vi.mock('@/features/pieces', async () => ({
  piecesHooks: (await vi.importActual('@/features/pieces/hooks/pieces-hooks'))
    .piecesHooks,
}));

const dialogPieces: PieceMetadataModel[] = [];
vi.mock('@/app/connections/create-edit-connection-dialog', () => ({
  CreateOrEditConnectionDialog: ({ piece }: { piece: PieceMetadataModel }) => {
    dialogPieces.push(piece);
    return <div data-testid="connection-dialog">{piece.version}</div>;
  },
}));
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
}));

import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';

describe('ReconnectButtonDialog piece version', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    dialogPieces.length = 0;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('reconnects an OAuth2 connection at the latest version so new scopes are offered', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: gmail({ version: LATEST_VERSION, scope: LATEST_SCOPES }),
    });

    await openReconnect(gmailConnection());

    expect(dialogPieces.at(-1)?.version).toBe(LATEST_VERSION);
    expect(dialogPieces.every((p) => p.version === LATEST_VERSION)).toBe(true);
  });

  it('keeps the stored version when the latest renames the OAuth2 props', async () => {
    servePieces({
      stored: gmail({
        version: STORED_VERSION,
        scope: STORED_SCOPES,
        props: { subdomain: subdomainProp() },
      }),
      latest: gmail({
        version: LATEST_VERSION,
        scope: LATEST_SCOPES,
        props: { region: subdomainProp() },
      }),
    });

    await openReconnect(gmailConnection());

    expect(dialogPieces.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('keeps the stored version when the latest no longer offers OAuth2', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: {
        ...gmail({ version: LATEST_VERSION, scope: LATEST_SCOPES }),
        auth: PieceAuth.SecretText({ displayName: 'API key', required: true }),
      },
    });

    await openReconnect(gmailConnection());

    expect(dialogPieces.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('keeps the stored version when the latest is older than the stored one', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: gmail({ version: OLDER_VERSION, scope: STORED_SCOPES }),
    });

    await openReconnect(gmailConnection());

    expect(dialogPieces.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('keeps the stored version when the latest fails to load', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: notFoundError(),
    });

    await openReconnect(gmailConnection());

    expect(dialogPieces.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('reconnects a custom-auth connection at its stored version without loading the latest', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: gmail({ version: LATEST_VERSION, scope: LATEST_SCOPES }),
    });

    await openReconnect(
      gmailConnection({ type: AppConnectionType.CUSTOM_AUTH }),
    );

    expect(dialogPieces.at(-1)?.version).toBe(STORED_VERSION);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({ version: STORED_VERSION }),
    );
  });

  it('does not open the dialog on the stored version while the latest is still loading', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: new Promise(() => undefined),
    });

    renderDialog(gmailConnection());
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(dialogPieces).toHaveLength(0);
  });

  function servePieces({
    stored,
    latest,
  }: {
    stored: PieceMetadataModel;
    latest: PieceMetadataModel | Error | Promise<never>;
  }) {
    get.mockImplementation(({ version }: { version?: string }) => {
      if (version !== undefined) {
        return Promise.resolve(stored);
      }
      return latest instanceof Error
        ? Promise.reject(latest)
        : Promise.resolve(latest);
    });
  }

  function renderDialog(connection: AppConnectionWithoutSensitiveData) {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReconnectButtonDialog
          connection={connection}
          onConnectionCreated={() => undefined}
          hasPermission={true}
        />
      </QueryClientProvider>,
    );
  }

  async function openReconnect(connection: AppConnectionWithoutSensitiveData) {
    renderDialog(connection);
    fireEvent.click(screen.getByRole('button'));
    await screen.findByTestId('connection-dialog');
  }
});

function gmail({
  version,
  scope,
  props,
}: {
  version: string;
  scope: string[];
  props?: Record<string, ReturnType<typeof subdomainProp>>;
}): PieceMetadataModel {
  return {
    name: PIECE_NAME,
    displayName: 'Gmail',
    version,
    auth: PieceAuth.OAuth2({
      authUrl: 'https://accounts.google.com/o/oauth2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      required: true,
      scope,
      props,
    }),
  } as PieceMetadataModel;
}

function subdomainProp() {
  return Property.ShortText({ displayName: 'Subdomain', required: true });
}

function gmailConnection(
  overrides: Partial<AppConnectionWithoutSensitiveData> = {},
): AppConnectionWithoutSensitiveData {
  return {
    id: 'conn_1',
    externalId: 'gmail_conn',
    displayName: 'Gmail',
    pieceName: PIECE_NAME,
    pieceVersion: STORED_VERSION,
    type: AppConnectionType.OAUTH2,
    scope: AppConnectionScope.PROJECT,
    projectIds: ['project_1'],
    ...overrides,
  } as AppConnectionWithoutSensitiveData;
}

function notFoundError(): AxiosError {
  return new AxiosError('Not Found', '404', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

const PIECE_NAME = '@activepieces/piece-gmail';
const STORED_VERSION = '0.12.10';
const LATEST_VERSION = '0.19.0';
const OLDER_VERSION = '0.11.0';
const STORED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'email',
];
const LATEST_SCOPES = [
  ...STORED_SCOPES,
  'https://www.googleapis.com/auth/gmail.modify',
];
