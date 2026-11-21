import { createAction } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { recordParamsUtils } from '../common/record-params';
import { twentyRecordProps } from '../common/record-props';
import { twentyMetadataUtils } from '../common/metadata';

export const findRecords = createAction({
  auth: twentyAuth,
  name: 'findRecords',
  displayName: 'Find Records',
  description: 'Finds records of any object in Twenty CRM.',
  aiMetadata: {
    description:
      'Finds records of the selected object in Twenty CRM that match every given filter. Emails, links and phones also match their additional values. Use to resolve a record to its ID before updating it, or to check whether it exists. Returns at most limit records (default 60), or every match when the limit is turned off. Idempotent: a read-only query with no side effects.',
    idempotent: true,
  },
  classification: 'SEARCH',
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Object',
      icon: 'tag',
      props: ['object'],
    },
    {
      key: 'filters',
      display: 'section',
      label: 'Filter Fields',
      icon: 'filter',
      props: ['fields', 'filters'],
    },
  ],
  props: {
    object: twentyRecordProps.object({
      required: true,
      description:
        'The type of record to search, e.g. People, Companies or one of your custom objects.',
    }),
    fields: twentyRecordProps.fields({
      required: true,
      displayName: 'Filter By',
      description: 'The fields to filter on.',
    }),
    filters: twentyRecordProps.filters({ required: false }),
    limitEnabled: twentyRecordProps.limitEnabled({
      description:
        'Stop after a set number of records. Turn off to return every matching record.',
    }),
    limit: twentyRecordProps.limit({
      description:
        'The most records to return.',
    }),
  },
  async run(context) {
    const { object, filters, limitEnabled, limit } = context.propsValue;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object.');

    return await twentyApi.findRecords({
      auth: context.auth,
      objectNamePlural: object.namePlural,
      conditions: recordParamsUtils.parseQueryConditions({
        input: filters ?? {},
      }),
      limit: recordParamsUtils.parseLimit({
        enabled: limitEnabled,
        input: limit?.['limit'],
      }),
    });
  },
});
