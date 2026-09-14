// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AfterImportFlowRedirect } from '@/app/guards/after-import-flow-redirect';

const FLOW_ID = 'flow_1';
const OTHER_FLOW_ID = 'flow_2';
const builderPageKey = (flowId: string) => [
  'flow',
  flowId,
  undefined,
  'project_1',
];
const versionPinnedKey = ['flow', FLOW_ID, 'version_1'];

const renderRedirect = (queryClient: QueryClient) =>
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

describe('AfterImportFlowRedirect', () => {
  it('purges every cached query of the imported flow whatever its key shape, and keeps other flows', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(builderPageKey(FLOW_ID), { id: FLOW_ID });
    queryClient.setQueryData(versionPinnedKey, { id: FLOW_ID });
    queryClient.setQueryData(builderPageKey(OTHER_FLOW_ID), {
      id: OTHER_FLOW_ID,
    });

    renderRedirect(queryClient);

    expect(queryClient.getQueryData(builderPageKey(FLOW_ID))).toBeUndefined();
    expect(queryClient.getQueryData(versionPinnedKey)).toBeUndefined();
    expect(queryClient.getQueryData(builderPageKey(OTHER_FLOW_ID))).toEqual({
      id: OTHER_FLOW_ID,
    });
  });

  it('redirects to the builder route of the imported flow', () => {
    const { container } = renderRedirect(new QueryClient());

    expect(container.textContent).toContain('builder');
  });
});
