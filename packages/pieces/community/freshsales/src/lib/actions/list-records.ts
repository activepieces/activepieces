import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { listRecordsOutputSchema } from '../output-schemas';

export const listRecords = createAction({
  auth: freshsalesAuth,
  name: 'list_records',
  displayName: 'List Records in View',
  description: 'List contacts, accounts or deals from a saved view',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of contacts, accounts or deals from a saved Freshsales view (the All view when View is empty), newest updated first. Returns records, page, total and has_more; call again with Page + 1 while has_more is true.',
    idempotent: true,
  },
  outputSchema: listRecordsOutputSchema,
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Record Type',
      description: 'Which records to list',
      required: true,
      options: { disabled: false, options: freshsalesProps.ENTITY_OPTIONS },
    }),
    view_id: freshsalesProps.view(),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Records per page (1-100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const entity = context.propsValue.entity;
    if (!freshsalesRecords.isRecordEntity(entity)) {
      throw new Error('Record Type must be contacts, sales_accounts or deals.');
    }
    const page = context.propsValue.page ?? 1;
    const perPage = context.propsValue.per_page ?? 25;
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a whole number of 1 or more.');
    }
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
      throw new Error('Per Page must be a whole number between 1 and 100.');
    }
    const viewId =
      freshsalesClient.toId({ value: context.propsValue.view_id, field: 'View' }) ??
      (await freshsalesProps.findDefaultViewId({ auth: context.auth, entity }));
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/${entity}/view/${viewId}`,
      query: {
        page: String(page),
        per_page: String(perPage),
        sort: 'updated_at',
        sort_type: 'desc',
        include: freshsalesRecords.RECORD_INCLUDES[entity],
      },
    });
    const records = freshsalesClient
      .readArray({ body: response, key: entity })
      .filter((item) => freshsalesClient.isRecord(item))
      .map((record) => freshsalesRecords.shapeRecord({ entity, record }));
    const meta = freshsalesClient.readMeta(response);
    const hasMore =
      meta.total_pages !== undefined
        ? page < meta.total_pages
        : meta.total !== undefined
        ? page * perPage < meta.total
        : records.length === perPage;
    return { records, page, total: meta.total ?? null, has_more: hasMore };
  },
});
