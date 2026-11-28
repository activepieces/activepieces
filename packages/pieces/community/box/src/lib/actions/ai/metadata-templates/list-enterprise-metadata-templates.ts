import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListEnterpriseMetadataTemplatesOutputSchema } from '../../../output-schemas';

export const listEnterpriseMetadataTemplatesAction = createAction({
  auth: boxAuth,
  name: 'box_list_enterprise_metadata_templates',
  outputSchema: boxListEnterpriseMetadataTemplatesOutputSchema,
  displayName: 'List Enterprise Metadata Templates',
  description: 'Lists the metadata templates created in the user\'s Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s own metadata templates with their id, scope, templateKey and fields, for Create File Metadata, Query Metadata and the other metadata actions. Use List Global Metadata Templates for Box-provided ones. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/metadata_templates/enterprise',
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
