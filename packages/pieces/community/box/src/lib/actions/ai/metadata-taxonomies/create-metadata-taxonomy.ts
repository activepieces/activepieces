import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTaxonomyOutputSchema } from '../../../output-schemas';

export const createMetadataTaxonomyAction = createAction({
  auth: boxAuth,
  name: 'box_create_metadata_taxonomy',
  outputSchema: boxCreateMetadataTaxonomyOutputSchema,
  displayName: 'Create Metadata Taxonomy',
  description: 'Creates a metadata taxonomy for use in metadata templates.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an empty hierarchical taxonomy and returns its key; needs admin rights. Then add levels with Create Metadata Taxonomy Levels or Append Metadata Taxonomy Level, and nodes with Create Metadata Taxonomy Node. The enterprise ID for Namespace comes from Get Current User.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The taxonomy name shown in Box, e.g. "Geography".',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: 'Unique key in the namespace: letters, digits, "_" and "-", starting with a letter or "_". Derived from Display Name when empty.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/metadata_taxonomies',
      body: {
        namespace: propsValue.namespace,
        displayName: propsValue.displayName,
        ...(propsValue.key !== undefined ? { key: propsValue.key } : {}),
      },
    });
  },
});
