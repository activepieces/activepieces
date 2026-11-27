import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListGlobalMetadataTemplatesOutputSchema } from '../../../output-schemas';

export const listGlobalMetadataTemplatesAction = createAction({
  auth: boxAuth,
  name: 'box_list_global_metadata_templates',
  outputSchema: boxListGlobalMetadataTemplatesOutputSchema,
  displayName: 'List Global Metadata Templates',
  description: 'Lists the global metadata templates Box provides to every enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the Box-provided global templates (such as "properties" for free-form key/value pairs) with their scope, templateKey and fields. Use List Enterprise Metadata Templates for the enterprise\'s own templates. Page with Marker (next_marker).',
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
      path: '/metadata_templates/global',
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
