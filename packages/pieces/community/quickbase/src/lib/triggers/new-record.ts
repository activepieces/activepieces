import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, pollingIntervalProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseRecordResponse, QuickbaseField } from '../common/types';
import { generateDeduplicationKey, extractRecordValues } from '../common/utils';

export const newRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a Quickbase table',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    pollingInterval: pollingIntervalProp,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {

    await context.store?.put('lastCheck', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('lastCheck');
  },
  async run(context) {
    const { appId, tableId } = context.propsValue;
    const client = new QuickbaseClient(context.auth);

    const lastCheck = await context.store?.get('lastCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const currentCheck = new Date().toISOString();

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    const dateCreatedField = tableFields.find(f => f.type === 'timestamp' && f.label.toLowerCase().includes('created'));
    
    if (!dateCreatedField) {
      throw new Error('No date created field found in table. A timestamp field with "created" in the name is required.');
    }

    const query = {
      from: tableId,
      select: tableFields.map(f => f.id),
      where: `{${dateCreatedField.id}.AF.'${lastCheck}'}`,
      sortBy: [{ fieldId: dateCreatedField.id, order: 'DESC' as const }],
      options: { top: 100 },
    };

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);
    
    await context.store?.put('lastCheck', currentCheck);

    return response.data.map(record => {
      const recordId = record['3']?.value;
      const dateCreated = record[dateCreatedField.id.toString()]?.value;
      
      return {
        id: generateDeduplicationKey(recordId, dateCreated),
        created_at: dateCreated,
        updated_at: record[tableFields.find(f => f.type === 'timestamp' && f.label.toLowerCase().includes('modified'))?.id.toString() || '']?.value || dateCreated,
        recordId,
        tableId,
        appId,
        fields: extractRecordValues(record),
      };
    });
  },
  async test(context) {
    const { appId, tableId } = context.propsValue;
    const client = new QuickbaseClient(context.auth);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    
    const query = {
      from: tableId,
      select: tableFields.map(f => f.id),
      options: { top: 1 },
    };

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);
    
    if (response.data.length === 0) {
      return [];
    }

    const record = response.data[0];
    const recordId = record['3']?.value;
    const dateCreated = record[tableFields.find(f => f.type === 'timestamp')?.id.toString() || '']?.value || new Date().toISOString();

    return [{
      id: generateDeduplicationKey(recordId, dateCreated),
      created_at: dateCreated,
      updated_at: dateCreated,
      recordId,
      tableId,
      appId,
      fields: extractRecordValues(record),
    }];
  },
  sampleData: {
    id: '123-2023-10-29T12:00:00Z',
    created_at: '2023-10-29T12:00:00Z',
    updated_at: '2023-10-29T12:00:00Z',
    recordId: 123,
    tableId: 'bq7xxxxxx',
    appId: 'bq6xxxxxx',
    fields: {
      '3': 123,
      '6': 'Sample Record',
      '7': 'sample@example.com',
    },
  },
});