// @vitest-environment jsdom
import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { routeLocation } from '@/lib/route-location';

describe('routeLocation', () => {
  it('uses the window URL before any router navigates', () => {
    window.history.replaceState(null, '', '/projects/from-url/runs');
    expect(routeLocation.pathname()).toBe('/projects/from-url/runs');
  });

  it('follows a tracked router as soon as it navigates', async () => {
    const router = createMemoryRouter([{ path: '*', element: null }]);
    routeLocation.track(router);
    await router.navigate('/projects/from-router/automations');
    expect(routeLocation.pathname()).toBe('/projects/from-router/automations');
  });
});
