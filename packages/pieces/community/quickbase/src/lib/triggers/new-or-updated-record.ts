import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, pollingIntervalProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseRecordResponse, QuickbaseField } from '../common/types';
import { generateDeduplicationKey, extractRecordValues } from '../common/utils';

export const newOrUpdatedRecord = createTrigger({
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description: 'Triggers when a record is created or updated in a Quickbase table',
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
    const dateModifiedField = tableFields.find(f => f.type === 'timestamp' && f.label.toLowerCase().includes('modified'));
    
    if (!dateModifiedField) {
      throw new Error('No date modified field found in table. A timestamp field with "modified" in the name is required.');
    }

    const query = {
      from: tableId,
      select: tableFields.map(f => f.id),
      where: `{${dateModifiedField.id}.AF.'${lastCheck}'}`,
      sortBy: [{ fieldId: dateModifiedField.id, order: 'DESC' as const }],
      options: { top: 100 },
    };

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);
    
    await context.store?.put('lastCheck', currentCheck);

    return response.data.map(record => {
      const recordId = record['3']?.value;
      const dateModified = record[dateModifiedField.id.toString()]?.value;
      const dateCreated = record[tableFields.find(f => f.type === 'timestamp' && f.label.toLowerCase().includes('created'))?.id.toString() || '']?.value;
      
      return {
        id: generateDeduplicationKey(recordId, dateModified),
        created_at: dateCreated || dateModified,
        updated_at: dateModified,
        recordId,
        tableId,
        appId,
        fields: extractRecordValues(record),
        isNew: dateCreated === dateModified,
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
    const dateModified = record[tableFields.find(f => f.type === 'timestamp')?.id.toString() || '']?.value || new Date().toISOString();

    return [{
      id: generateDeduplicationKey(recordId, dateModified),
      created_at: dateModified,
      updated_at: dateModified,
      recordId,
      tableId,
      appId,
      fields: extractRecordValues(record),
      isNew: true,
    }];
  },
  sampleData: {
    id: '123-2023-10-29T12:00:00Z',
    created_at: '2023-10-29T12:00:00Z',
    updated_at: '2023-10-29T12:00:00Z',
    recordId: 123,
    tableId: 'bq7xxxxxx',
    appId: 'bq6xxxxxx',
    isNew: false,
    fields: {
      '3': 123,
      '6': 'Sample Record',
      '7': 'sample@example.com',
    },
  },
});