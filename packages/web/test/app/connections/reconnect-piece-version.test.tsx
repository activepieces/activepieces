// @vitest-environment jsdom
import {
  PieceAuth,
  PieceMetadataModel,
  Property,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionStatus,
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

const dialogRenders: DialogRender[] = [];
vi.mock('@/app/connections/create-edit-connection-dialog', () => ({
  CreateOrEditConnectionDialog: ({
    piece,
    open,
    reconnectConnection,
  }: {
    piece: PieceMetadataModel;
    open: boolean;
    reconnectConnection: AppConnectionWithoutSensitiveData | null;
  }) => {
    dialogRenders.push({
      version: piece.version,
      open,
      reconnecting: reconnectConnection !== null,
    });
    return open ? (
      <div data-testid="connection-dialog">{piece.version}</div>
    ) : null;
  },
}));
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectAction: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: () => null,
}));
vi.mock('@/components/custom/permission-needed-tooltip', () => ({
  PermissionNeededTooltip: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
  useIsPlatformAdmin: () => false,
}));
vi.mock('@/features/connections', () => ({
  appConnectionsQueries: {
    useAppConnections: () => ({
      data: { data: [gmailConnection()] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
  appConnectionUtils: { getConnectionAccountIdentifier: () => null },
}));

import { ConnectionSelect } from '@/app/connections/connection-select';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';

describe('ReconnectButtonDialog piece version', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    dialogRenders.length = 0;
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

    expect(dialogRenders.at(-1)?.version).toBe(LATEST_VERSION);
    expect(dialogRenders.every((r) => r.version === LATEST_VERSION)).toBe(true);
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

    expect(dialogRenders.at(-1)?.version).toBe(STORED_VERSION);
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

    expect(dialogRenders.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('keeps the stored version when the latest is older than the stored one', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: gmail({ version: OLDER_VERSION, scope: STORED_SCOPES }),
    });

    await openReconnect(gmailConnection());

    expect(dialogRenders.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('keeps the stored version when the latest fails to load', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: notFoundError(),
    });

    await openReconnect(gmailConnection());

    expect(dialogRenders.at(-1)?.version).toBe(STORED_VERSION);
  });

  it('reconnects a custom-auth connection at its stored version without loading the latest', async () => {
    servePieces({
      stored: gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      latest: gmail({ version: LATEST_VERSION, scope: LATEST_SCOPES }),
    });

    await openReconnect(
      gmailConnection({ type: AppConnectionType.CUSTOM_AUTH }),
    );

    expect(dialogRenders.at(-1)?.version).toBe(STORED_VERSION);
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

    expect(dialogRenders).toHaveLength(0);
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

describe('ConnectionSelect piece version', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    dialogRenders.length = 0;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    get.mockImplementation(({ version }: { version?: string }) =>
      Promise.resolve(
        version === undefined
          ? gmail({ version: LATEST_VERSION, scope: LATEST_SCOPES })
          : gmail({ version: STORED_VERSION, scope: STORED_SCOPES }),
      ),
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('reconnects at the latest version while Create Connection keeps the step version', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConnectionSelect
          piece={gmail({ version: STORED_VERSION, scope: STORED_SCOPES })}
          value={`{{connections['${gmailConnection().externalId}']}}`}
          onChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    const createConnection = await screen.findByText('Create Connection');
    const reconnect = screen
      .getAllByRole('button')
      .find((button) => !button.contains(createConnection));
    fireEvent.click(reconnect!);

    await screen.findByTestId('connection-dialog');
    expect(dialogRenders.at(-1)).toEqual({
      version: LATEST_VERSION,
      open: true,
      reconnecting: true,
    });
    expect(
      dialogRenders
        .filter((r) => r.open && r.reconnecting)
        .every((r) => r.version === LATEST_VERSION),
    ).toBe(true);

    fireEvent.click(screen.getByText('Create Connection'));

    await waitFor(() =>
      expect(dialogRenders.at(-1)).toEqual({
        version: STORED_VERSION,
        open: true,
        reconnecting: false,
      }),
    );
  });
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
    status: AppConnectionStatus.ACTIVE,
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

type DialogRender = {
  version: string;
  open: boolean;
  reconnecting: boolean;
};

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
