// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  NavigateFunction,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AfterImportFlowRedirect } from '@/app/guards/after-import-flow-redirect';
import { FlowBuilderPage } from '@/app/routes/flows/id';
import { flowHooks } from '@/features/flows';

const server = vi.hoisted(() => ({
  displayName: 'old_draft_marker',
  triggerSampleData: 'old_sample_data',
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: {
    get: async (flowId: string) => ({
      id: flowId,
      projectId: 'project_1',
      version: {
        id: 'version_1',
        flowId,
        displayName: server.displayName,
        state: 'DRAFT',
        trigger: { name: 'trigger', type: 'EMPTY', settings: {}, valid: true },
      },
    }),
  },
}));
vi.mock('@/features/flows/api/sample-data-api', () => ({
  sampleDataApi: {
    get: async () => server.triggerSampleData,
  },
}));
vi.mock('@/app/builder', () => ({ BuilderPage: () => null }));
vi.mock('@/app/builder/state/builder-state-provider', async () => {
  const { useRef } = await import('react');
  return {
    BuilderStateProvider: (props: {
      flowVersion: { displayName: string };
      outputSampleData: Record<string, unknown>;
    }) => {
      const propsAtMount = useRef(props).current;
      return (
        <div data-testid="builder">
          {propsAtMount.flowVersion.displayName}:
          {String(propsAtMount.outputSampleData['trigger'])}
        </div>
      );
    },
  };
});

const FLOW_ID = 'flow_1';
const OTHER_FLOW_ID = 'flow_2';
const cachedFlow = (flowId: string) => ({
  id: flowId,
  version: { id: `${flowId}_version` },
});

const openBuilderOnFlow = () => {
  const navigation: { navigate?: NavigateFunction } = {};
  const CaptureNavigate = () => {
    navigation.navigate = useNavigate();
    return null;
  };
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/flows/${FLOW_ID}`]}>
        <CaptureNavigate />
        <Routes>
          <Route path="/flows/:flowId" element={<FlowBuilderPage />} />
          <Route
            path="/flow-import-redirect/:flowId"
            element={<AfterImportFlowRedirect />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return navigation;
};

describe('AfterImportFlowRedirect', () => {
  afterEach(() => {
    server.displayName = 'old_draft_marker';
    server.triggerSampleData = 'old_sample_data';
  });

  it('remounts the builder page on the imported flow instead of its cached pre-import copy', async () => {
    const navigation = openBuilderOnFlow();
    expect(
      await screen.findByText('old_draft_marker:old_sample_data'),
    ).toBeTruthy();

    server.displayName = 'imported_marker';
    server.triggerSampleData = 'imported_sample_data';
    act(() => {
      navigation.navigate?.(`/flow-import-redirect/${FLOW_ID}`);
    });

    expect(
      await screen.findByText('imported_marker:imported_sample_data'),
    ).toBeTruthy();
  });

  it('purges version-pinned queries of the imported flow and keeps other flows', () => {
    const queryClient = new QueryClient();
    const versionPinnedKey = flowHooks.createFlowQueryKeys({
      flowId: FLOW_ID,
      versionId: 'version_1',
    });
    const otherFlowKey = flowHooks.createFlowQueryKeys({
      flowId: OTHER_FLOW_ID,
      versionId: undefined,
    });
    queryClient.setQueryData(versionPinnedKey, cachedFlow(FLOW_ID));
    queryClient.setQueryData(otherFlowKey, cachedFlow(OTHER_FLOW_ID));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/flow-import-redirect/${FLOW_ID}`]}>
          <Routes>
            <Route
              path="/flow-import-redirect/:flowId"
              element={<AfterImportFlowRedirect />}
            />
            <Route path="/flows/:flowId" element={<div>builder</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(queryClient.getQueryData(versionPinnedKey)).toBeUndefined();
    expect(queryClient.getQueryData(otherFlowKey)).toEqual(
      cachedFlow(OTHER_FLOW_ID),
    );
    expect(screen.getByText('builder')).toBeTruthy();
  });
});
