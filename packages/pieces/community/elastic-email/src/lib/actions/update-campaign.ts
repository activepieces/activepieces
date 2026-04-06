import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import { CAMPAIGN_STATUS_OPTIONS } from '../common/constants';
import {
  campaignNameProp,
  listNamesProp,
  segmentNamesProp,
  templateNameProp,
} from '../common/props';

export const updateCampaignAction = createAction({
  name: 'update_campaign',
  displayName: 'Update Campaign',
  description: 'Update an existing campaign in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    campaign: campaignNameProp,
    name: Property.ShortText({
      displayName: 'New Campaign Name',
      description: 'New name for the campaign. Leave empty to keep existing.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email with optional name. Leave empty to keep existing.',
      required: false,
    }),
    recipientListNames: listNamesProp,
    recipientSegmentNames: segmentNamesProp,
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address. Leave empty to keep existing.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject. Leave empty to keep existing.',
      required: false,
    }),
    templateName: templateNameProp,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Campaign status. Leave empty to keep existing.',
      required: false,
      options: {
        options: CAMPAIGN_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const campaignName = String(propsValue.campaign);

    // Fetch current campaign to merge unchanged fields
    const current = await elasticEmailRequest<{
      Name?: string;
      Recipients?: { ListNames?: string[]; SegmentNames?: string[] };
      Content?: Array<{
        From?: string;
        ReplyTo?: string;
        Subject?: string;
        TemplateName?: string;
      }>;
      Status?: string;
    }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/campaigns/${encodeURIComponent(campaignName)}`,
    });

    const currentContent = current.Content?.[0] ?? {};

    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.PUT,
      path: `/campaigns/${encodeURIComponent(campaignName)}`,
      body: {
        Name: propsValue.name || current.Name,
        Recipients: {
          ListNames: propsValue.recipientListNames && propsValue.recipientListNames.length > 0
            ? propsValue.recipientListNames
            : (current.Recipients?.ListNames ?? undefined),
          SegmentNames: propsValue.recipientSegmentNames && propsValue.recipientSegmentNames.length > 0
            ? propsValue.recipientSegmentNames
            : (current.Recipients?.SegmentNames ?? undefined),
        },
        Content: [
          {
            From: propsValue.from || currentContent.From,
            ReplyTo: propsValue.replyTo || currentContent.ReplyTo,
            Subject: propsValue.subject || currentContent.Subject,
            TemplateName:
              propsValue.templateName || currentContent.TemplateName,
          },
        ],
        Status: propsValue.status || current.Status,
      },
    });
  },
});
