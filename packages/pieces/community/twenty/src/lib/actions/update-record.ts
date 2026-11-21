import { createAction } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { recordParamsUtils } from '../common/record-params';
import { twentyRecordProps } from '../common/record-props';
import { twentyApi } from '../common/api';
import { twentyMetadataUtils } from '../common/metadata';

export const updateRecord = createAction({
  auth: twentyAuth,
  name: 'updateRecord',
  displayName: 'Update Record',
  classification: 'WRITE',
  description: 'Updates a record of any object in Twenty CRM.',
  aiMetadata: {
    description:
      'Updates one record of the selected object in Twenty CRM, identified by its record ID (resolve it first with Find Records). Changes only the chosen fields; list fields get the new values added unless Rewrite is on. If no values are given it returns the current record. Idempotent when Rewrite is on; with Rewrite off, list values are merged so repeating the call leaves the record unchanged.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Object type',
      icon: 'tag',
      props: ['object', 'recordId'],
    },
    {
      key: 'fields',
      display: 'section',
      label: 'Fields to update',
      icon: 'tag',
      props: ['fields', 'values'],
    },
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'settings',
      props: ['rewrite'],
    },
  ],
  props: {
    object: twentyRecordProps.object({ required: true }),
    recordId: twentyRecordProps.recordId({ required: true }),
    rewrite: twentyRecordProps.rewrite({ required: false }),
    fields: twentyRecordProps.fields({
      displayName: 'Selected fields',
      description: 'The fields to change on the record.',
      required: true,
      purpose: 'write',
    }),
    values: twentyRecordProps.values({
      displayName: 'Updates',
      required: false,
    }),
  },
  async run(context) {
    const { object, recordId, rewrite, values } = context.propsValue;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object type.');

    const recordValues = recordParamsUtils.parseRecordValues({
      input: values ?? {},
    });
    if (Object.keys(recordValues).length === 0)
      return await twentyApi.getRecord({
        auth: context.auth,
        objectNamePlural: object.namePlural,
        recordId,
      });

    return await twentyApi.updateRecord({
      auth: context.auth,
      objectNamePlural: object.namePlural,
      recordId,
      recordValues,
      appendArrays: !rewrite,
    });
  },
});
