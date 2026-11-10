import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listIds, segmentIds } from '../common/props';
import { createDraftCampaignOutputSchema } from '../output-schemas';

export const createDraftCampaignAction = createAction({
  auth: campaignMonitorAuth,
  name: 'create_draft_campaign',
  classification: 'WRITE',
  displayName: 'Create Draft Campaign',
  description: 'Creates a draft campaign from hosted HTML content.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a draft email campaign for a Campaign Monitor client, importing its HTML (and optional text) content from public URLs, addressed to the given lists and/or segments, and returns the new campaign ID. The draft is not sent: use Send Campaign afterwards. At least one list or segment is required. Not idempotent: every call creates another draft.',
    idempotent: false,
  },
  outputSchema: createDraftCampaignOutputSchema,
  props: {
    clientId: clientId,
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Internal name; must be unique among the client campaigns.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      description: 'Sender address; must be verified in Campaign Monitor.',
      required: true,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      required: true,
    }),
    htmlUrl: Property.ShortText({
      displayName: 'HTML Content URL',
      description: 'Public URL of the HTML content to import.',
      required: true,
    }),
    textUrl: Property.ShortText({
      displayName: 'Text Content URL',
      description: 'Public URL of the plain-text version. Optional.',
      required: false,
    }),
    listIds: listIds,
    segmentIds: segmentIds,
  },
  async run({ propsValue, auth }) {
    const lists = propsValue.listIds ?? [];
    const segments = propsValue.segmentIds ?? [];
    if (lists.length === 0 && segments.length === 0) {
      throw new Error('Select at least one list or segment.');
    }
    const textUrl = propsValue.textUrl?.trim();
    const response = await makeRequest<string>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/campaigns/${propsValue.clientId}.json`,
      body: {
        Name: propsValue.name,
        Subject: propsValue.subject,
        FromName: propsValue.fromName,
        FromEmail: propsValue.fromEmail.trim(),
        ReplyTo: propsValue.replyTo.trim(),
        HtmlUrl: propsValue.htmlUrl.trim(),
        TextUrl: textUrl ? textUrl : undefined,
        ListIDs: lists,
        SegmentIDs: segments,
      },
    });
    return {
      campaignId: String(response.body),
      name: propsValue.name,
    };
  },
});
