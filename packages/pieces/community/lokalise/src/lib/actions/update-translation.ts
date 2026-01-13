import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';

export const updateTranslation = createAction({
  auth: lokaliseAuth,
  name: 'updateTranslation',
  displayName: 'Update Translation',
  description: 'Update a translation in your Lokalise project',
  props: {
    projectId: projectDropdown,
    translationId: Property.ShortText({
      displayName: 'Translation ID',
      description: 'Unique translation identifier',
      required: true,
    }),
    translation: Property.LongText({
      displayName: 'Translation',
      description:
        'The actual translation content. Use JSON object format for plural keys',
      required: true,
    }),
    isUnverified: Property.Checkbox({
      displayName: 'Mark as Unverified',
      description: 'Whether the Unverified flag is enabled',
      required: false,
      defaultValue: false,
    }),
    isReviewed: Property.Checkbox({
      displayName: 'Mark as Reviewed',
      description: 'Whether the Reviewed flag is enabled',
      required: false,
      defaultValue: false,
    }),
    custom_translation_status_ids: Property.Array({
      displayName: 'Custom Translation Status IDs',
      description:
        'Comma-separated custom translation status IDs to assign (existing statuses will be replaced)',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      translationId,
      translation,
      isUnverified,
      isReviewed,
      custom_translation_status_ids,
    } = context.propsValue;

    const body: any = {
      translation,
      ...(isUnverified !== undefined && { is_unverified: isUnverified }),
      ...(isReviewed !== undefined && { is_reviewed: isReviewed }),
      ...(custom_translation_status_ids &&
        custom_translation_status_ids.length > 0 && {
          custom_translation_status_ids: custom_translation_status_ids,
        }),
    };

    const path = `/projects/${projectId}/translations/${translationId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      path,
      body
    );

    return response;
  },
});
