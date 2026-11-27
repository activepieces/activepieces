import { expect, test } from '@playwright/test';
import config from '../playwright.config';

test('platform-state specs run after the parallel specs, one at a time', { tag: '@platform-state' }, () => {
  const [parallel, platformState] = config.projects ?? [];

  expect(test.info().project.name).toBe(platformState?.name);
  expect(test.info().project.dependencies).toEqual([parallel?.name]);
  expect(platformState?.workers).toBe(1);
});
