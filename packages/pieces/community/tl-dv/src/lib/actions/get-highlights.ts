import { createAction } from '@activepieces/pieces-framework';
import { tldvAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';
import { meetingIdProperty } from '../common/props';

export const getHighlights = createAction({
  auth: tldvAuth,
  name: 'get_highlights',
  displayName: 'Get Highlights',
  description: 'Get meeting highlights (notes) by meeting ID',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the highlights and notes captured for a tl;dv meeting identified by its meeting id. Use to pull the key moments or noted points from a meeting rather than the full transcript. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    meetingId: meetingIdProperty,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await tldvCommon.apiCall<{
      meetingId: string;
      data: Array<{
        id?: string;
        text?: string;
        timestamp?: number;
        [key: string]: any;
      }>;
    }>({
      method: HttpMethod.GET,
      url: `/v1alpha1/meetings/${meetingId}/highlights`,
      auth: { apiKey: context.auth.secret_text },
    });

    return response;
  },
});

