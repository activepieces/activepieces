import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { partialUpdateAlgoliaRecord } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { algoliaProps } from '../common/props';
import { parseAlgoliaRecord, parseRequiredString } from '../common/utils';

export const updateRecordAttributesAction = createAction({
  auth: algoliaAuth,
  name: 'update_record_attributes',
  classification: 'WRITE',
  displayName: 'Update Record Attributes',
  description: 'Changes some attributes of one Algolia record, keeping the rest.',
  audience: 'ai',
  aiMetadata: {
    description: 'Sets the given attributes on one Algolia record identified by objectID; attributes not listed keep their values. Pass attributes as a JSON object of plain values (e.g. {"price": 12, "stock": 3}). By default a missing objectID is a silent no-op (no record is created); set createIfNotExists to \"yes\" to create it. Not idempotent in general: plain values are safe to repeat (the record ends in the same state), but Algolia built-in operations such as {"stock": {"_operation": "Increment", "value": 1}} (Increment, Decrement, Add, Remove, AddUnique) are applied again on every call. Returns status published, or notPublished if Algolia was still applying the change after 30 seconds (it will still be applied, do not retry).',
    idempotent: false,
  },
  outputSchema: algoliaOutputSchemas.updateRecordAttributes,
  props: {
    indexName: algoliaProps.indexName(),
    objectID: Property.ShortText({
      displayName: 'Object ID',
      description: 'The objectID of the record to update.',
      required: true,
    }),
    attributes: Property.Json({
      displayName: 'Attributes',
      description: 'JSON object of attributes to set, e.g. {"price": 12}.',
      required: true,
    }),
    createIfNotExists: Property.StaticDropdown<string>({
      displayName: 'Create If Not Exists',
      description: 'Create the record when no record has this objectID. Default: no.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const { propsValue } = context;

    return partialUpdateAlgoliaRecord({
      auth: context.auth,
      indexName: parseRequiredString(propsValue.indexName, 'Index Name'),
      objectID: parseRequiredString(propsValue.objectID, 'Object ID'),
      attributes: parseAlgoliaRecord({ value: propsValue.attributes, fieldName: 'Attributes' }),
      createIfNotExists: propsValue.createIfNotExists === 'yes',
    });
  },
});
