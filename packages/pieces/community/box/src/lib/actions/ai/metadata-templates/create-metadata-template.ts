import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTemplateOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const createMetadataTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_create_metadata_template',
  outputSchema: boxCreateMetadataTemplateOutputSchema,
  displayName: 'Create Metadata Template',
  description: 'Creates a metadata template in the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an enterprise metadata template and returns its id and templateKey, for Create File Metadata and Query Metadata; needs admin rights. Fails if the template key is already used in the enterprise.',
    idempotent: false,
  },
  props: {
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The template name shown in Box.',
      required: true,
    }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: false,
      description: 'Unique key in the enterprise: letters, digits, "_" and "-", starting with a letter or "_", up to 64 characters. Derived from Display Name when empty.',
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'JSON array of fields, in order. Each has type (string, float, date, enum, multiSelect or taxonomy), key and displayName; optional description and hidden; options [{"key": "..."}] for enum and multiSelect; taxonomyKey, namespace and optionsRules for taxonomy. E.g. [{"type": "string", "key": "client", "displayName": "Client"}].',
      required: false,
    }),
    hidden: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Hidden',
      description: '"true" hides the template in the Box web app so it is only used through the API.',
    }),
    copyInstanceOnItemCopy: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Copy With Item',
      description: '"true" copies this metadata when a file or folder that has it is copied.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.fields !== undefined && !Array.isArray(propsValue.fields)) {
      throw new Error('Fields must be a JSON array of field objects.');
    }
    for (const [label, value] of [
      ['Hidden', propsValue.hidden],
      ['Copy With Item', propsValue.copyInstanceOnItemCopy],
    ]) {
      if (value !== undefined && !BOOLEANS.includes(value)) {
        throw new Error(`${label} must be "true" or "false".`);
      }
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/metadata_templates/schema',
      body: {
        scope: 'enterprise',
        displayName: propsValue.displayName,
        ...(propsValue.templateKey !== undefined ? { templateKey: propsValue.templateKey } : {}),
        ...(propsValue.fields !== undefined ? { fields: propsValue.fields } : {}),
        ...(propsValue.hidden !== undefined ? { hidden: propsValue.hidden === 'true' } : {}),
        ...(propsValue.copyInstanceOnItemCopy !== undefined
          ? { copyInstanceOnItemCopy: propsValue.copyInstanceOnItemCopy === 'true' }
          : {}),
      },
    });
  },
});
