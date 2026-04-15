import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';
import { prepareQuery } from '../common/client';

export const findRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_records',
  displayName: 'List Records',
  description: 'Retrieves a list of records from a table with optional filtering, sorting, and pagination.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'A filter expression for the records. Use the visual query builder at https://app.teable.ai/developer/tool/query-builder to build one.',
      required: false,
    }),
    cellFormat: Property.StaticDropdown({
      displayName: 'Cell Format',
      description: 'The format of the cell values in the response.',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    take: Property.Number({
      displayName: 'Take',
      description: 'The record count you want to take, maximum is 1000.',
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'The records count you want to skip.',
      required: false,
      defaultValue: 0,
    }),
    selectedRecordIds: Property.Array({
      displayName: 'Selected Record IDs',
      description: 'Filter selected records by record ids.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, filter, cellFormat, take, skip, selectedRecordIds } = context.propsValue;

    const client = makeClient(context.auth as TeableAuthValue);

    return await client.listRecords(
      table_id,
      prepareQuery({
        filter,
        cellFormat,
        take,
        skip,
        selectedRecordIds,
      })
    );
  },
});

