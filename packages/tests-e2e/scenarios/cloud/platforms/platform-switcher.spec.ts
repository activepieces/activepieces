import { test } from '../../../fixtures';
import { PlatformSwitcherPage } from '../../../pages/platform-switcher.page';

test.describe('Platform switcher', () => {
  test('platform switcher hides Create Platform for a platform owner', async ({ page }) => {
    const platformSwitcherPage = new PlatformSwitcherPage(page);
    await platformSwitcherPage.open();
    await platformSwitcherPage.expectCreatePlatformHidden();
  });
});
