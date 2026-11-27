import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { twentyMetadataUtils } from '../common/metadata';
import { recordParamsUtils } from '../common/record-params';
import { twentyRecordProps } from '../common/record-props';

export const deleteRecords = createAction({
  auth: twentyAuth,
  name: 'deleteRecords',
  displayName: 'Delete Records',
  description:
    'Deletes the records that match the filters. By default they go to the trash, where they can be restored.',
  aiMetadata: {
    description:
      'Deletes every record of the selected object in Twenty CRM that matches all given filters. By default the records move to the trash (soft delete) and can still be restored; with permanent set to true they are destroyed and cannot be recovered, so only set it when the user explicitly asks for permanent deletion. Deletes at most limit records per run (default 60), or every match when the limit is turned off. Fails when no filter is set, so it never deletes a whole object by accident. Returns the deleted records. Not idempotent: a repeat call deletes whatever matches at that moment.',
    idempotent: false,
  },
  classification: 'DESTRUCTIVE',
  propertyGroups: [
    {
      key: 'object',
      display: 'section',
      label: 'Object type',
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
        'The type of record to delete, e.g. People, Companies or one of your custom objects.',
    }),
    fields: twentyRecordProps.fields({
      required: true,
      displayName: 'Filter By',
      description:
        'The fields to match records on. Only records that match every filter are deleted.',
    }),
    filters: twentyRecordProps.filters({ required: true }),
    permanent: Property.Checkbox({
      required: false,
      displayName: 'Delete Permanently',
      advanced: true,
      description:
        'Removes the matching records for good instead of moving them to the trash. This cannot be undone, so check your filters with Find Records first.',
      defaultValue: false,
    }),
    limitEnabled: twentyRecordProps.limitEnabled({
      description:
        'Stop after a set number of records. Turn off to delete every matching record.',
    }),
    limit: twentyRecordProps.limit({
      description:
        'The most records to delete in one run. Matching records beyond the limit are left alone.',
    }),
  },
  async run(context) {
    const { object, filters, permanent, limitEnabled, limit } =
      context.propsValue;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object.');

    const conditions = recordParamsUtils.parseQueryConditions({
      input: filters ?? {},
    });
    if (conditions.length === 0)
      throw new Error('Set at least one filter to match records on.');

    return await twentyApi.deleteRecords({
      auth: context.auth,
      objectNamePlural: object.namePlural,
      conditions,
      permanent: permanent ?? false,
      limit: recordParamsUtils.parseLimit({
        enabled: limitEnabled,
        input: limit?.['limit'],
      }),
    });
  },
});
