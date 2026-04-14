import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import { CAMPAIGN_STATUS_OPTIONS } from '../common/constants';
import {
  listNamesProp,
  segmentNamesProp,
  templateNameProp,
} from '../common/props';

export const createCampaignAction = createAction({
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new email campaign in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email with optional name (e.g. `email@domain.com` or `John Doe <email@domain.com>`).',
      required: true,
    }),
    recipientListNames: listNamesProp,
    recipientSegmentNames: segmentNamesProp,
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial campaign status.',
      required: true,
      options: {
        options: CAMPAIGN_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Default email subject line.',
      required: false,
    }),
    templateName: templateNameProp,
  },
  async run({ auth, propsValue }) {
    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/campaigns',
      body: {
        Name: propsValue.name,
        Recipients: {
          ListNames: propsValue.recipientListNames && propsValue.recipientListNames.length > 0
            ? propsValue.recipientListNames
            : undefined,
          SegmentNames: propsValue.recipientSegmentNames && propsValue.recipientSegmentNames.length > 0
            ? propsValue.recipientSegmentNames
            : undefined,
        },
        Content: [
          {
            From: propsValue.from,
            ReplyTo: propsValue.replyTo,
            Subject: propsValue.subject ?? undefined,
            TemplateName: propsValue.templateName ?? undefined,
          },
        ],
        Status: propsValue.status,
      },
    });
  },
});
