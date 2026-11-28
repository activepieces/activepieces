import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostValidationReport } from '../common/types';

export const checkPostAction = createAction({
  auth: adaptlyPostAuth,
  name: 'check_post',
  classification: 'READ',
  displayName: 'Check Post',
  description:
    'Checks a post without creating it and reports, for each account, what would stop it from publishing.',
  audience: 'both',
  aiMetadata: {
    description:
      'Dry-run a post with the same fields as Create Post. Nothing is created, scheduled or published. Returns valid, and per account whether it is READY, WARNING or BLOCKED with the reasons. Use it before Create Post to catch text that is too long or media a platform refuses. Safe to retry.',
    idempotent: true,
  },
  props: adaptlyPostProps.postContent(),
  async run(context) {
    const response =
      await adaptlyPostClient.request<AdaptlyPostValidationReport>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/social-posts/validate',
        body: adaptlyPostProps.postBody(context.propsValue),
      });
    return adaptlyPostOutput.validation(response);
  },
});
