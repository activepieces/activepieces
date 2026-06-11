import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendsparkAuth } from '../auth';
import { sendsparkCommon } from '../common';

type ProspectResult = {
  _id: string;
  campaign: string;
  contactName: string;
  status: string;
  createdAt: string;
};

export const createDynamicVideoAction = createAction({
  auth: sendsparkAuth,
  name: 'create_dynamic_video',
  displayName: 'Create Dynamic Video',
  description:
    'Generates a personalized dynamic video for a prospect in a Sendspark campaign.',
  props: {
    campaign_id: sendsparkCommon.dynamicCampaignDropdown,
    contact_name: Property.ShortText({
      displayName: 'Contact Name',
      required: false,
    }),
    contact_email: Property.ShortText({
      displayName: 'Contact Email',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    background_url: Property.ShortText({
      displayName: 'Background URL',
      description: 'URL of a custom background image to use in the video.',
      required: false,
    }),
  },
  async run(context) {
    const {
      campaign_id,
      contact_name,
      contact_email,
      company,
      job_title,
      background_url,
    } = context.propsValue;

    const requestBody = {
      processAndAuthorizeCharge: true,
      prospect: {
        ...(contact_name && { contactName: contact_name }),
        ...(contact_email && { contactEmail: contact_email }),
        ...(company && { company }),
        ...(job_title && { jobTitle: job_title }),
        ...(background_url && { backgroundUrl: background_url }),
      },
    };

    const response = await sendsparkCommon.sendsparkApiCall<{
      prospectList: ProspectResult[];
    }>({
      apiKey: context.auth.props.api_key,
      apiSecret: context.auth.props.api_secret,
      method: HttpMethod.POST,
      path: `/workspaces/${context.auth.props.workspace_id}/dynamics/${campaign_id}/prospect`,
      body: requestBody,
    });

    return response.body.prospectList?.[0] ?? response.body;
  },
});
