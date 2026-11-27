import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { twentyMetadataUtils } from '../common/metadata';
import { recordParamsUtils } from '../common/record-params';
import { twentyRecordProps } from '../common/record-props';
import {
  QueryConditionNode,
  TwentyAuthValue,
  TwentyRecord,
} from '../common/types';

export const createOrUpdateRecords = createAction({
  auth: twentyAuth,
  name: 'createOrUpdateRecords',
  displayName: 'Create or Update Records',
  description:
    'Updates the records matching the filters, or creates a new record when none match.',
  aiMetadata: {
    description:
      'Updates the records of the selected object in Twenty CRM that match the filters, or creates a new record with the given values when none match. With Update All on it updates at most limit records per run (default 60), or every match when the limit is turned off; with it off it fails when more than one record matches. Returns whether records were created or updated. Not idempotent: the created record only matches later calls if the filtered fields are among the values set, otherwise each call creates another record.',
    idempotent: false,
  },
  classification: 'WRITE',
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Object type',
      icon: 'tag',
      props: ['object', 'searchFields', 'filters'],
    },
    {
      key: 'fields',
      display: 'section',
      label: 'Fields to create or update',
      icon: 'tag',
      props: ['updateFields', 'values'],
    },
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'settings',
      props: ['updateAll'],
    },
  ],
  props: {
    object: twentyRecordProps.object({ required: true }),
    searchFields: twentyRecordProps.fields({
      required: true,
      displayName: 'Match On',
      description: 'The fields used to find the records to update.',
    }),
    filters: twentyRecordProps.filters({
      required: true,
      fieldsProp: 'searchFields',
    }),
    updateAll: Property.Checkbox({
      required: false,
      displayName: 'Update all matching records',
      description:
        'Update every record that matches. When unchecked, the step fails if more than one record matches.',
      defaultValue: true,
    }),
    limitEnabled: twentyRecordProps.limitEnabled({
      description:
        'Stop after a set number of records. Turn off to update every matching record. Only used when updating all matching records.',
    }),
    limit: twentyRecordProps.limit({
      description:
        'The most records to update in one run. Only used when updating all matching records.',
    }),
    updateFields: twentyRecordProps.fields({
      required: true,
      displayName: 'Selected fields',
      description: 'The fields to set on the record.',
      purpose: 'write',
    }),
    values: twentyRecordProps.values({
      displayName: 'Values',
      fieldsProp: 'updateFields',
      required: false,
    }),
  },
  async run(context) {
    const { object, filters, values, updateAll, limitEnabled, limit } =
      context.propsValue;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object.');

    const conditions = recordParamsUtils.parseQueryConditions({
      input: filters ?? {},
    });
    if (conditions.length === 0)
      throw new Error('Set at least one filter to match records on.');

    const recordValues = recordParamsUtils.parseRecordValues({
      input: values ?? {},
    });
    const params = {
      auth: context.auth,
      objectNamePlural: object.namePlural,
      conditions,
      recordValues,
    };

    const updated = updateAll
      ? await twentyApi.updateRecords({
          ...params,
          limit: recordParamsUtils.parseLimit({
            enabled: limitEnabled,
            input: limit?.['limit'],
          }),
        })
      : await updateSingleMatch(params);
    if (updated.length > 0) return { action: 'updated', records: updated };

    const created = await twentyApi.createRecord({
      auth: context.auth,
      objectNamePlural: object.namePlural,
      recordValues,
    });
    return { action: 'created', records: created ? [created] : [] };
  },
});

async function updateSingleMatch({
  auth,
  objectNamePlural,
  conditions,
  recordValues,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  conditions: QueryConditionNode[];
  recordValues: Record<string, unknown>;
}): Promise<TwentyRecord[]> {
  const found = await twentyApi.findRecords({
    auth,
    objectNamePlural,
    conditions,
    limit: 2,
  });
  if (found.length > 1)
    throw new Error(
      'More than one record matches. Narrow the filters or turn on "Update all matching records".'
    );

  const [match] = found;
  if (!match?.id) return [];

  const updated = await twentyApi.updateRecord({
    auth,
    objectNamePlural,
    recordId: match.id,
    recordValues,
  });
  return updated ? [updated] : [];
}
