import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';

export const checkSourceNowAction = createAction({
  auth: reviewflowzAuth,
  name: 'check_source_now',
  classification: 'WRITE',
  displayName: 'Check Source for New Reviews',
  description: 'Checks a source for new reviews now, instead of waiting for its next scheduled check.',
  audience: 'both',
  aiMetadata: {
    description:
      'Ask Reviewflowz to check one source for new reviews right away instead of at its next scheduled check. New reviews arrive through the New Review trigger. A check already running is not doubled, so retries are safe.',
    idempotent: true,
  },
  props: {
    source: reviewflowzProps.source(),
  },
  async run(context) {
    return reviewflowzApi.call({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/sources/${encodeURIComponent(String(context.propsValue.source))}/sync`,
    });
  },
});
