import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';

export const createSegmentAction = createAction({
  name: 'create_segment',
  displayName: 'Create Segment',
  description:
    'Create a new contact segment in Elastic Email using a SQL-like rule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a named contact segment in Elastic Email defined by a SQL-like rule that selects which contacts belong to it. Use to build a reusable audience for campaigns. The rule must follow Elastic Email segment-rule syntax. Each call creates a separate segment, so it is not idempotent.',
    idempotent: false,
  },
  auth: elasticEmailAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Segment Name',
      required: true,
    }),
    rule: Property.ShortText({
      displayName: 'Rule',
      description:
        'SQL-like rule to determine which contacts belong to this segment. See https://help.elasticemail.com/en/articles/5162182-segment-rules',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/segments',
      body: {
        Name: propsValue.name,
        Rule: propsValue.rule,
      },
    });
  },
});
