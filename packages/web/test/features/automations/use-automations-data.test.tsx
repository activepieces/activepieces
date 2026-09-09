// @vitest-environment jsdom
import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ projectId: 'test_project' }),
}));
vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { hideTables: false } }),
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'test_project' },
}));

const listFlows = vi.fn();
const listFolders = vi.fn();
const listTables = vi.fn();
vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: { list: (request: unknown) => listFlows(request) },
}));
vi.mock('@/features/folders/api/folders-api', () => ({
  foldersApi: { list: () => listFolders() },
}));
vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { list: (request: unknown) => listTables(request) },
}));

import { useAutomationsData } from '@/features/automations/hooks/use-automations-data';
import { AutomationsFilters } from '@/features/automations/lib/types';

const flow = {
  id: 'flow_1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-02T00:00:00.000Z',
  folderId: null,
  version: { displayName: 'Linear sync flow' },
  status: 'ENABLED',
} as unknown as PopulatedFlow;

const table = {
  id: 'table_1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-02T00:00:00.000Z',
  name: 'lifecycle_shadow',
  folderId: null,
} as unknown as Table;

const folder = {
  id: 'folder_1',
  displayName: 'Marketing',
  numberOfFlows: 1,
  numberOfTables: 1,
} as unknown as FolderDto;

const flowInFolder = {
  ...flow,
  id: 'flow_2',
  folderId: 'folder_1',
  version: {
    displayName: 'Linear sync flow',
    connectionIds: ['conn_external_id'],
  },
} as unknown as PopulatedFlow;

const unrelatedFlowInFolder = {
  ...flow,
  id: 'flow_3',
  folderId: 'folder_1',
  version: { displayName: 'Unrelated flow', connectionIds: [] },
} as unknown as PopulatedFlow;

const tableInFolder = {
  ...table,
  id: 'table_2',
  name: 'ea_reviews',
  folderId: 'folder_1',
} as unknown as Table;

const emptyFilters: AutomationsFilters = {
  searchTerm: '',
  typeFilter: [],
  statusFilter: [],
  connectionFilter: [],
  ownerFilter: [],
  folderFilter: [],
};

function renderAutomationsData(filters: AutomationsFilters) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAutomationsData({ filters, sort: 'default' }), {
    wrapper,
  });
}

describe('useAutomationsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFolders.mockResolvedValue([]);
    listFlows.mockResolvedValue({ data: [flow], next: null, previous: null });
    listTables.mockResolvedValue({ data: [table], next: null, previous: null });
  });

  it('does not fetch or show tables when a connection filter is active', async () => {
    const { result } = renderAutomationsData({
      ...emptyFilters,
      connectionFilter: ['conn_external_id'],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listTables).not.toHaveBeenCalled();
    expect(
      result.current.treeItems.filter((item) => item.type === 'table'),
    ).toEqual([]);
    expect(
      result.current.treeItems.filter((item) => item.type === 'flow'),
    ).toHaveLength(1);
  });

  it('still fetches and shows tables when no filters are active', async () => {
    const { result } = renderAutomationsData(emptyFilters);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listTables).toHaveBeenCalled();
    expect(
      result.current.treeItems.filter((item) => item.type === 'table'),
    ).toHaveLength(1);
  });

  it('keeps tables out of name-matched folder contents when a connection filter is active', async () => {
    listFolders.mockResolvedValue([folder]);
    listFlows.mockImplementation((request: { folderIds?: string[] }) =>
      Promise.resolve({
        data: request.folderIds ? [flowInFolder, unrelatedFlowInFolder] : [],
        next: null,
        previous: null,
      }),
    );
    listTables.mockImplementation((request: { folderIds?: string[] }) =>
      Promise.resolve({
        data: request.folderIds ? [tableInFolder] : [table],
        next: null,
        previous: null,
      }),
    );

    const { result } = renderAutomationsData({
      ...emptyFilters,
      searchTerm: 'mark',
      connectionFilter: ['conn_external_id'],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(
      result.current.treeItems.filter((item) => item.type === 'folder'),
    ).toHaveLength(1);
    expect(
      result.current.treeItems.filter((item) => item.type === 'table'),
    ).toEqual([]);
    const flowItems = result.current.treeItems.filter(
      (item) => item.type === 'flow',
    );
    expect(flowItems).toHaveLength(1);
    expect(flowItems[0].id).toBe('flow_2');
  });
});
