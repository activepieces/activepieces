import { createAction, Property } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { groupDropdown } from '../common/dropdown';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCampaign = createAction({
  auth: SenderAuth,
  name: 'createCampaign',
  displayName: 'Create Campaign',
  description: "Create a new campaign in Sender",
  props: {
    title: Property.ShortText({
      displayName: "Campaign Name (Optional)",
      required: false,
    }),
    subject: Property.ShortText({
      displayName: "Subject",
      required: true,
    }),
    fromName: Property.ShortText({
      displayName: "From Name",
      required: true,
    }),
    replyTo: Property.ShortText({
      displayName: "Reply-To Email",
      required: true,
    }),
    preheader: Property.ShortText({
      displayName: "Preheader",
      required: false,
    }),
    contentType: Property.StaticDropdown({
      displayName: "Content Type",
      required: true,
      defaultValue: "html",
      options: {
        options: [
          { label: "Editor", value: "editor" },
          { label: "HTML", value: "html" },
          { label: "Plain Text", value: "text" },
        ],
      }
    }),
    googleAnalytics: Property.Checkbox({
      displayName: "Enable Google Analytics",
      required: false,
      defaultValue: false,
    }),
    autoFollowupSubject: Property.ShortText({
      displayName: "Auto Follow-up Subject",
      required: false,
    }),
    autoFollowupDelay: Property.StaticDropdown({
      displayName: "Auto Follow-up Delay (hours)",
      required: false,
      options: {
        options: [
          { label: "12h", value: 12 },
          { label: "24h", value: 24 },
          { label: "48h", value: 48 },
          { label: "72h", value: 72 },
          { label: "96h", value: 96 },
          { label: "120h", value: 120 },
          { label: "144h", value: 144 },
          { label: "168h", value: 168 },
        ],
      }
    }),
    autoFollowupActive: Property.Checkbox({
      displayName: "Activate Auto Follow-up",
      required: false,
      defaultValue: false,
    }),
    groups: groupDropdown,
    content: Property.LongText({
      displayName: "Campaign Content",
      required: true,
      description: "HTML or plain text content depending on Content Type",
    }),
  },

  async run({ auth, propsValue }) {
    const body: any = {
      subject: propsValue.subject,
      from: propsValue.fromName,
      reply_to: propsValue.replyTo,
      content_type: propsValue.contentType,
      content: propsValue.content,
    };

    if (propsValue.title) body.title = propsValue.title;
    if (propsValue.preheader) body.preheader = propsValue.preheader;
    if (propsValue.googleAnalytics) body.google_analytics = 1;
    if (propsValue.autoFollowupSubject) body.auto_followup_subject = propsValue.autoFollowupSubject;
    if (propsValue.autoFollowupDelay) body.auto_followup_delay = propsValue.autoFollowupDelay;
    if (propsValue.autoFollowupActive) body.auto_followup_active = 1;
    if (propsValue.groups) {
      body.groups = [propsValue.groups];
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        "/campaigns",
        body
      );
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      throw new Error(`Sender API error: ${err.message}`);
    }
  },
});