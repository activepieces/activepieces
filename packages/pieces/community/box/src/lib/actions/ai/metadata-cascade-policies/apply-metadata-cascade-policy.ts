import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxApplyMetadataCascadePolicyOutputSchema } from '../../../output-schemas';

const CONFLICT_RESOLUTIONS = ['none', 'overwrite'];

export const applyMetadataCascadePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_apply_metadata_cascade_policy',
  outputSchema: boxApplyMetadataCascadePolicyOutputSchema,
  displayName: 'Apply Metadata Cascade Policy',
  description: 'Applies a folder\'s cascading metadata to all the items already inside it.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts copying the folder\'s metadata to every item already inside it; it runs in the background and Box has no way to check its progress. "overwrite" replaces values items already have. Get the ID from List Metadata Cascade Policies or Create Metadata Cascade Policy.',
    idempotent: true,
  },
  props: {
    metadataCascadePolicyId: boxAiProps.metadataCascadePolicyId({ required: true }),
    conflictResolution: Property.StaticDropdown({
      displayName: 'Conflict Resolution',
      description: 'For items that already have this template: "none" keeps their values, "overwrite" replaces them with the folder\'s.',
      required: true,
      options: { options: CONFLICT_RESOLUTIONS.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (!CONFLICT_RESOLUTIONS.includes(propsValue.conflictResolution)) {
      throw new Error(`Conflict Resolution must be one of: ${CONFLICT_RESOLUTIONS.join(', ')}.`);
    }
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/metadata_cascade_policies/${encodeURIComponent(propsValue.metadataCascadePolicyId)}/apply`,
      body: { conflict_resolution: propsValue.conflictResolution },
    });
    return {
      started: true,
      metadataCascadePolicyId: propsValue.metadataCascadePolicyId,
      conflictResolution: propsValue.conflictResolution,
    };
  },
});
