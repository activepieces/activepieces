import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from './api';
import { test as base } from './index';

export const test = base.extend<{ platformBranding: PlatformBranding; platformConfiguration: PlatformConfigurationState }>({
  platformBranding: async ({ request, session }, use) => {
    const project = await e2eApi.callApi<{ platformId: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${session.projectId}` });
    const path = `/api/v1/platforms/${project.platformId}`;
    const read = () => e2eApi.callApi<Platform>({ request, session, method: 'GET', path });
    const before = await read();
    expect(before.plan.customAppearanceEnabled, 'The E2E license plan has no customAppearanceEnabled, so the platform cannot save its branding').toBe(true);

    await use({ before, read });

    const restored = { name: before.name, primaryColor: before.primaryColor, themeColors: before.themeColors ?? null };
    await e2eApi.callApi({ request, session, method: 'POST', path, data: restored });
    expect(await read(), 'The teardown did not restore the platform name and colours').toMatchObject(restored);
  },

  platformConfiguration: async ({ request, session }, use) => {
    const read = () => readConfiguration({ request, session });
    const before = await read();

    await use({ before, read });

    const restored = { isInfraSetupTelemetryEnabled: before.isInfraSetupTelemetryEnabled };
    await e2eApi.callApi({ request, session, method: 'POST', path: CONFIGURATION_PATH, data: restored });
    expect(await read(), 'The teardown did not restore the platform configuration').toMatchObject(restored);
  },
});

export { expect } from '@playwright/test';

function readConfiguration({ request, session }: { request: APIRequestContext; session: E2eSession }): Promise<PlatformConfiguration> {
  return e2eApi.callApi<PlatformConfiguration>({ request, session, method: 'GET', path: CONFIGURATION_PATH });
}

const CONFIGURATION_PATH = '/api/v1/platform-configurations';

export type Platform = {
  name: string;
  primaryColor: string;
  themeColors?: Record<string, unknown> | null;
  plan: { customAppearanceEnabled: boolean };
};

type PlatformConfiguration = { isInfraSetupTelemetryEnabled: boolean };
type PlatformBranding = { before: Platform; read: () => Promise<Platform> };
type PlatformConfigurationState = { before: PlatformConfiguration; read: () => Promise<PlatformConfiguration> };
