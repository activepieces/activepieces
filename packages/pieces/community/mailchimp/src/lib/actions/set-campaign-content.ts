import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const setCampaignContent = createAction({
  auth: mailchimpAuth,
  name: 'set_campaign_content',
  classification: 'WRITE',
  displayName: 'Set Campaign Content',
  description: 'Replace the content of a draft campaign with HTML, a template, or a web page URL.',
  audience: 'both',
  aiMetadata: {
    description: 'Replaces the whole body of a draft campaign (campaign_id with status save). Give exactly one source: HTML (optionally with plain text), a template ID (from List Templates), or a public URL whose page Mailchimp imports. Idempotent: the same input sets the same content again.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['campaignContent'],
  props: {
    campaign_id: mailchimpCommon.mailChimpDraftCampaignIdDropdown,
    html: Property.LongText({
      displayName: 'HTML',
      description: 'Full HTML of the email.',
      required: false,
    }),
    plain_text: Property.LongText({
      displayName: 'Plain Text',
      description: 'Optional plain-text version, used together with HTML.',
      required: false,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Numeric ID of a saved template (from List Templates).',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Content URL',
      description: 'Public web page URL to import as the campaign content.',
      required: false,
    }),
  },
  async run(context) {
    const html = mailchimpApi.optionalText(context.propsValue.html);
    const plainText = mailchimpApi.optionalText(context.propsValue.plain_text);
    const templateId = mailchimpApi.optionalText(context.propsValue.template_id);
    const url = mailchimpApi.optionalText(context.propsValue.url);
    const sources = [html ?? plainText, templateId, url].filter((value) => value !== undefined);
    if (sources.length !== 1) {
      throw new Error('Provide exactly one content source: HTML (with optional plain text), Template ID, or Content URL.');
    }
    if (templateId !== undefined && !/^\d+$/.test(templateId)) {
      throw new Error('Template ID must be a number.');
    }
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    const body =
      templateId !== undefined
        ? { template: { id: Number(templateId) } }
        : url !== undefined
        ? { url }
        : { ...(html !== undefined ? { html } : {}), ...(plainText !== undefined ? { plain_text: plainText } : {}) };
    const content = await client.request<CampaignContent>({
      method: HttpMethod.PUT,
      path: `${path}/content`,
      body,
      operation: 'set campaign content',
    });
    return {
      campaign_id: campaignId,
      html: content.html ?? '',
      plain_text: content.plain_text ?? '',
    };
  },
});

type CampaignContent = { html?: string; plain_text?: string };
