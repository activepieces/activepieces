import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesInModerationOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesInModeration = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_in_moderation',
  outputSchema: cloudinaryListResourcesInModerationOutputSchema,
  displayName: 'List Resources in Moderation',
  description: 'Lists assets by moderation type and status.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists assets of one resource type that are in a moderation queue with a given status, for example manual moderation pending review. Add-on moderation kinds (webpurify, aws_rek, perception_point, etc.) only return results when that add-on is enabled. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    moderation_kind: Property.StaticDropdown({
      displayName: 'Moderation Kind',
      description: 'The moderation type.',
      required: true,
      defaultValue: 'manual',
      options: {
        options: ['manual', 'webpurify', 'aws_rek', 'aws_rek_video', 'perception_point', 'google_video_moderation', 'duplicate'].map((value) => ({ label: value, value })),
      },
    }),
    moderation_status: Property.StaticDropdown({
      displayName: 'Moderation Status',
      description: 'The moderation status to match.',
      required: true,
      defaultValue: 'pending',
      options: {
        options: ['pending', 'approved', 'rejected', 'queued', 'aborted'].map((value) => ({ label: value, value })),
      },
    }),
    direction: aiProps.direction(),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, `/resources/${propsValue.resource_type}/moderations/${propsValue.moderation_kind}/${propsValue.moderation_status}`, undefined, {
        direction: propsValue.direction,
        max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
        next_cursor: propsValue.next_cursor,
      });
    return aiResults.toResourceList({ response });
  },
});
