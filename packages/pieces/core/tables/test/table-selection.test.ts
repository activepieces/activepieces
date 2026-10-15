/// <reference types="vitest/globals" />

import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { clearTable } from '../src/lib/actions/clear-table';
import { deleteTable } from '../src/lib/actions/delete-table';
import { tablesCommon } from '../src/lib/common';
import { deletedRecordTrigger } from '../src/lib/triggers/deleted-record';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { updatedRecordTrigger } from '../src/lib/triggers/updated-record';

const missingTableIds = [[undefined], [''], ['  '], [{}], [[]]];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tablesCommon.convertTableExternalIdToId', () => {
  test('resolves the selected table by its external id', async () => {
    const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { data: [{ id: 'table-1', externalId: 'external-table-1' }] },
    });

    await expect(
      tablesCommon.convertTableExternalIdToId('external-table-1', createMockActionContext({ propsValue: {} }))
    ).resolves.toBe('table-1');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('externalIds%5B0%5D=external-table-1') })
    );
  });
});

describe.each([newRecordTrigger, updatedRecordTrigger, deletedRecordTrigger])('$displayName', (trigger) => {
  test.each(missingTableIds)('refuses to turn on when table_id is %j', async (tableId) => {
    const sendRequest = rejectHttpRequests();

    await expect(trigger.onEnable(buildTriggerContext(tableId))).rejects.toThrow('Select a table for this step');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('subscribes to the selected table and turns on only after the webhook id is stored', async () => {
    vi.spyOn(tablesCommon, 'convertTableExternalIdToId').mockResolvedValue('table-1');
    const createWebhook = vi.spyOn(tablesCommon, 'createWebhook').mockResolvedValue({ id: 'webhook-1' });
    const context = buildTriggerContext('external-table-1');
    let finishStoreWrite = () => undefined;
    const put = vi.spyOn(context.store, 'put').mockImplementation(
      () => new Promise((resolve) => {
        finishStoreWrite = () => resolve(undefined);
      })
    );
    let turnedOn = false;
    const enabling = trigger.onEnable(context).then(() => {
      turnedOn = true;
    });

    await vi.waitFor(() => expect(put).toHaveBeenCalledWith('webhookId', 'webhook-1'));
    expect(turnedOn).toBe(false);

    finishStoreWrite();
    await enabling;

    expect(turnedOn).toBe(true);
    expect(createWebhook).toHaveBeenCalledWith(expect.objectContaining({ tableId: 'table-1' }));
  });

  test('turns off without a table', async () => {
    const sendRequest = rejectHttpRequests();

    await expect(trigger.onDisable(buildTriggerContext(undefined))).resolves.toBeUndefined();
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe.each([clearTable, deleteTable])('$displayName', (action) => {
  test.each(missingTableIds)('fails without touching any table when table_id is %j', async (tableId) => {
    const sendRequest = rejectHttpRequests();

    await expect(action.run(createMockActionContext({ propsValue: { table_id: tableId } }))).rejects.toThrow(
      'Select a table for this step'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

function rejectHttpRequests() {
  return vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('unexpected HTTP request'));
}

function buildTriggerContext(tableId: unknown) {
  return {
    ...createMockActionContext({ propsValue: { table_id: tableId } }),
    webhookUrl: 'http://localhost:3000/api/v1/webhooks/test-flow-id',
  };
}
