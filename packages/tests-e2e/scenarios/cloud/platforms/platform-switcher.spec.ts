import { test } from '../../../fixtures';

test.describe('Platform switcher', () => {
  test('platform switcher hides Create Platform for a platform owner', async ({ platformSwitcherPage }) => {
    await platformSwitcherPage.open();
    await platformSwitcherPage.expectCreatePlatformHidden();
  });
});
