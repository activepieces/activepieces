import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';

export const listAllSubmissions = createAction({
  auth: jotformAuth,
  name: 'jotform_list_all_submissions',
  classification: 'SEARCH',
  displayName: 'List All Submissions',
  description: 'List submissions across every form owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists submissions across all of the connected account\'s forms, each with its submission ID, form ID, submitter IP, creation date, status and answers. Use List Form Submissions instead when only one form matters.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of submissions to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of submissions to skip, for pagination.',
      required: false,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/submissions',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      queryParams: {
        ...(context.propsValue.limit !== undefined
          ? { limit: String(context.propsValue.limit) }
          : {}),
        ...(context.propsValue.offset !== undefined
          ? { offset: String(context.propsValue.offset) }
          : {}),
      },
    });
  },
});
