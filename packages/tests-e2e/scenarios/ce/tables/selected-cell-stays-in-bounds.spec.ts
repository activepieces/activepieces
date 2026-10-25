import { expect, test } from '../../../fixtures';

const LONG_TEXT =
  'A note long enough to run far past the right edge of its own column and across everything beside it when nothing clips it. '.repeat(
    3,
  );

test.describe('Tables', () => {
  test('a selected cell clips its long text and the open editor still grows past the row', async ({
    page,
    request,
    tablesPage,
  }) => {
    test.setTimeout(120000);

    const { token, projectId } = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      projectId: localStorage.getItem('projectId'),
    }));
    if (!token || !projectId) {
      throw new Error('no signed-in session in localStorage');
    }
    const headers = { Authorization: `Bearer ${token}` };
    const createThroughApi = async ({
      path,
      data,
    }: {
      path: string;
      data: Record<string, unknown>;
    }) => {
      const response = await request.post(path, { headers, data });
      expect(response.ok(), `${path} answered ${response.status()}`).toBe(true);
      return response.json();
    };

    const table = await createThroughApi({
      path: '/api/v1/tables',
      data: { projectId, name: `Overflow ${Date.now()}` },
    });
    try {
      const notes = await createThroughApi({
        path: '/api/v1/fields',
        data: { tableId: table.id, name: 'Notes', type: 'TEXT' },
      });
      await createThroughApi({
        path: '/api/v1/records',
        data: {
          tableId: table.id,
          records: [[{ fieldId: notes.id, value: LONG_TEXT }]],
        },
      });

      await tablesPage.openTable({ projectId, tableId: table.id });
      const longTextCell = tablesPage.cell({ rowIdx: 0, columnIdx: 1 });

      await longTextCell.click();
      await expect(longTextCell).toBeFocused();
      expect(
        await longTextCell.evaluate((cell) => cell.scrollWidth > cell.clientWidth),
      ).toBe(true);

      const cellBox = await longTextCell.boundingBox();
      if (!cellBox) {
        throw new Error('the long text cell is not rendered');
      }
      const rightOfTheCell = {
        x: cellBox.x + cellBox.width + 40,
        y: cellBox.y + cellBox.height / 2,
      };
      const underPointer = await page.evaluate(({ x, y }) => {
        const element = document.elementFromPoint(x, y);
        return {
          cellId: element?.closest('[id^="editable-cell-"]')?.id ?? null,
          insideGrid: element?.closest('[role="grid"]') !== null,
        };
      }, rightOfTheCell);
      expect(underPointer).toEqual({ cellId: null, insideGrid: true });

      await longTextCell.dblclick();
      const editor = page.getByRole('textbox');
      await expect(editor).toBeVisible();
      const editorBox = await editor.boundingBox();
      if (!editorBox) {
        throw new Error('the cell editor is not rendered');
      }
      const belowTheRow = {
        x: editorBox.x + editorBox.width / 2,
        y: cellBox.y + cellBox.height + 20,
      };
      expect(editorBox.y + editorBox.height).toBeGreaterThan(belowTheRow.y);
      const tagUnderPointer = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? null,
        belowTheRow,
      );
      expect(tagUnderPointer).toBe('TEXTAREA');
    } finally {
      await request.delete(`/api/v1/tables/${table.id}`, { headers });
    }
  });
});
