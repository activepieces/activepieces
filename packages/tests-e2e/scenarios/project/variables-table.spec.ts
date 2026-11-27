import { mergeTests } from '@playwright/test';
import { test as listResponseTest } from '../../fixtures/list-response';
import { expect, test as variablesTest } from '../../fixtures/variables';
import { VariablesPage } from '../../pages/variables.page';

const test = mergeTests(variablesTest, listResponseTest);

test.describe('Variables table', { tag: ['@feature:variables', '@surface'] }, () => {
  test('the variables table searches, filters by owner and pages, and keeps that state after a reload', async ({ page, variables }) => {
    const variablesPage = new VariablesPage(page);
    const { word, names } = await variables.seedMany({ count: 11 });
    const owner = await variables.ownerLabel({ name: names[0] });

    await variablesPage.open();
    await variablesPage.filterByName(word);
    await variablesPage.filterByOwner(owner);
    await expect(variablesPage.rowsMatching(word)).toHaveCount(10);
    const firstPage = await variablesPage.shownNames({ names });

    await variablesPage.nextPage();
    await expect(variablesPage.rowsMatching(word)).toHaveCount(1);
    const secondPage = await variablesPage.shownNames({ names });

    await variablesPage.reload();
    await expect(variablesPage.rowsMatching(word)).toHaveCount(1);
    expect(await variablesPage.shownNames({ names })).toEqual(secondPage);
    expect(new URL(page.url()).searchParams.get('name')).toBe(word);
    expect(new URL(page.url()).searchParams.getAll('owner')).toEqual([owner.email]);

    await variablesPage.previousPage();
    await expect(variablesPage.rowsMatching(word)).toHaveCount(10);
    expect(await variablesPage.shownNames({ names })).toEqual(firstPage);
    expect(new Set([...firstPage, ...secondPage]).size).toBe(names.length);
  });

  test('the variables table shows its empty state and its error state', async ({ page, listResponse, variables }) => {
    const variablesPage = new VariablesPage(page);

    await variablesPage.openFilteredBy({ name: variables.uniqueName() });
    await expect(variablesPage.emptyState()).toBeVisible();

    const restore = await listResponse.fail({ resource: 'variables' });
    await variablesPage.reload();
    await expect(variablesPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });
    await restore();
    await variablesPage.expectRetrySucceeds();
    await expect(variablesPage.emptyState()).toBeVisible();
  });

  test('bulk delete removes only the selected variables', async ({ page, variables }) => {
    const variablesPage = new VariablesPage(page);
    const { word, names: [first, second, kept] } = await variables.seedMany({ count: 3 });

    await variablesPage.openFilteredBy({ name: word });
    await expect(variablesPage.rowsMatching(word)).toHaveCount(3);
    await variablesPage.bulkDelete({ names: [first, second] });

    await variablesPage.reload();
    await expect(variablesPage.row(kept)).toBeVisible();
    await expect(variablesPage.rowsMatching(word)).toHaveCount(1);
  });
});
