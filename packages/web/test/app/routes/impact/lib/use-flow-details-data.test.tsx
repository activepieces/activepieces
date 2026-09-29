// @vitest-environment jsdom
import { FlowStatus, PlatformAnalyticsReport } from '@activepieces/shared';
import { act, renderHook } from '@testing-library/react';
import { ReactNode, useContext } from 'react';
import { describe, expect, it } from 'vitest';

import { useFlowDetailsData } from '@/app/routes/impact/lib/use-flow-details-data';
import {
  RefreshAnalyticsContext,
  RefreshAnalyticsProvider,
} from '@/features/platform-admin/stores/refresh-analytics-context';

const report: PlatformAnalyticsReport = {
  id: 'report_1',
  created: '2026-09-01T00:00:00.000Z',
  updated: '2026-09-01T00:00:00.000Z',
  cachedAt: '2026-09-01T00:00:00.000Z',
  outdated: false,
  platformId: 'platform_1',
  users: [],
  runs: [
    { flowId: 'flow_1', day: '2026-09-01', runs: 4 },
    { flowId: 'flow_1', day: '2026-09-02', runs: 6 },
  ],
  flows: [
    {
      flowId: 'flow_1',
      flowName: 'Invoice sync',
      projectId: 'project_1',
      projectName: 'Finance',
      status: FlowStatus.ENABLED,
      timeSavedPerRun: 300,
      ownerId: 'user_1',
    },
  ],
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <RefreshAnalyticsProvider>{children}</RefreshAnalyticsProvider>
);

const renderFlowDetails = () =>
  renderHook(
    () => ({
      ...useFlowDetailsData(report),
      ...useContext(RefreshAnalyticsContext),
    }),
    { wrapper },
  );

describe('useFlowDetailsData', () => {
  it('uses the cached report value when no override exists', () => {
    const { result } = renderFlowDetails();

    expect(result.current.flowDetails?.[0]).toMatchObject({
      timeSavedPerRun: 300,
      runs: 10,
      minutesSaved: 3000,
    });
    expect(result.current.flowsMissingTimeSaved).toBe(0);
  });

  it('shows a cleared estimate as empty instead of the cached value', () => {
    const { result } = renderFlowDetails();

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', null));

    expect(result.current.flowDetails?.[0]).toMatchObject({
      timeSavedPerRun: null,
      minutesSaved: 0,
    });
    expect(result.current.flowsMissingTimeSaved).toBe(1);
  });

  it('applies an edited estimate and restores it after clearing', () => {
    const { result } = renderFlowDetails();

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', 120));
    expect(result.current.flowDetails?.[0]).toMatchObject({
      timeSavedPerRun: 120,
      minutesSaved: 1200,
    });

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', null));
    expect(result.current.flowDetails?.[0].minutesSaved).toBe(0);

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', 300));
    expect(result.current.flowDetails?.[0]).toMatchObject({
      timeSavedPerRun: 300,
      minutesSaved: 3000,
    });
  });
});
