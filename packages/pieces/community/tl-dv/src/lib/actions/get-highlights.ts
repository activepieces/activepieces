import { createAction } from '@activepieces/pieces-framework';
import { tldvAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';
import { meetingIdProperty } from '../common/props';

export const getHighlights = createAction({
  auth: tldvAuth,
  name: 'get_highlights',
  displayName: 'Get Highlights',
  description: 'Get meeting highlights (notes) by meeting ID',
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

