import { createAction } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { recordParamsUtils } from '../common/record-params';
import { twentyRecordProps } from '../common/record-props';
import { twentyMetadataUtils } from '../common/metadata';

export const createRecord = createAction({
  auth: twentyAuth,
  name: 'createRecord',
  displayName: 'Create Record',
  classification: 'WRITE',
  description: 'Creates a record of any object in Twenty CRM.',
  aiMetadata: {
    description:
      'Creates one record of the selected object (people, companies, opportunities or a custom object) in Twenty CRM, setting the chosen fields to the given values. Not idempotent: each call inserts a new record with no de-duplication, so repeated calls create duplicates.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Object type',
      icon: 'tag',
      props: ['object'],
    },
    {
      key: 'fields',
      display: 'section',
      label: 'Fields to set',
      icon: 'tag',
      props: ['fields', 'values'],
    },
  ],
  props: {
    object: twentyRecordProps.object({ required: true }),
    fields: twentyRecordProps.fields({
      displayName: 'Selected fields',
      description: 'The fields to set on the new record.',
      required: true,
      purpose: 'write',
    }),
    values: twentyRecordProps.values({
      displayName: 'Values',
      required: false,
    }),
  },
  async run(context) {
    const { object, values } = context.propsValue;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object type.');

    return await twentyApi.createRecord({
      auth: context.auth,
      objectNamePlural: object.namePlural,
      recordValues: recordParamsUtils.parseRecordValues({
        input: values ?? {},
      }),
    });
  },
});
