import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

import { ApiCampaign } from '../../common/client';

export const createCampaignDraftAi = createAction({
  auth: mailchimpAuth,
  name: 'create_campaign_draft',
  classification: 'WRITE',
  displayName: 'Create Campaign Draft',
  description: 'Create a regular email campaign draft for an audience or segment.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a regular email campaign as a draft (nothing is sent) for an audience (list_id), optionally limited to one segment or tag (segment_id from List Segments or Resolve Segment). reply_to must be a verified sender address in Mailchimp. Add the body with Set Campaign Content, test with Send Test Email, then Send Campaign. Not idempotent: each call creates a new draft.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['aiCampaignDraft'],
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience (list) ID, from List Audiences or Resolve Audience.',
      required: true,
    }),
    subject: Property.ShortText({ displayName: 'Subject Line', required: true }),
    from_name: Property.ShortText({ displayName: 'From Name', required: true }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Verified sender email that receives replies.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Internal Title',
      description: 'Title shown in Mailchimp only. Defaults to the subject.',
      required: false,
    }),
    segment_id: Property.ShortText({
      displayName: 'Segment ID',
      description: 'Optional numeric segment or tag ID to send to instead of the whole audience.',
      required: false,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const subject = mailchimpApi.requireText({ value: context.propsValue.subject, label: 'Subject Line' });
    const fromName = mailchimpApi.requireText({ value: context.propsValue.from_name, label: 'From Name' });
    const replyTo = mailchimpApi.requireText({ value: context.propsValue.reply_to, label: 'Reply-To Email' });
    const title = mailchimpApi.optionalText(context.propsValue.title) ?? subject;
    const segmentId = mailchimpApi.optionalText(context.propsValue.segment_id);
    if (segmentId !== undefined && !/^\d+$/.test(segmentId)) {
      throw new Error('Segment ID must be a number.');
    }
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const campaign = await client.request<ApiCampaign>({
      method: HttpMethod.POST,
      path: '/campaigns',
      body: {
        type: 'regular',
        recipients: {
          list_id: listId,
          ...(segmentId !== undefined ? { segment_opts: { saved_segment_id: Number(segmentId) } } : {}),
        },
        settings: { subject_line: subject, title, from_name: fromName, reply_to: replyTo },
      },
      operation: 'create campaign draft',
    });
    return {
      id: campaign.id,
      web_id: campaign.web_id,
      status: campaign.status,
      title: campaign.settings?.title ?? title,
      subject_line: campaign.settings?.subject_line ?? subject,
      list_id: campaign.recipients?.list_id ?? listId,
      segment_id: segmentId ?? null,
      archive_url: campaign.archive_url || null,
    };
  },
});
