import { createAction } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';
import { campaignDropdown, contactIdProp } from '../common/props';

export const enrollContactInCampaign = createAction({
  auth: arteemisAuth,
  name: 'enroll_contact_in_campaign',
  classification: 'WRITE',
  displayName: 'Enroll Contact in Campaign',
  description: 'Adds a contact to a campaign, which then sends its sequence (emails, LinkedIn invitations and messages) on its schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Enroll an existing Arteemis contact (by contact ID, with an email or a LinkedIn profile) in a campaign, which then sends its email and LinkedIn sequence on its schedule. It runs as a background job: the answer is the job ID and status, and the Background Job Finished trigger fires when it ends.',
    idempotent: false,
  },
  props: {
    campaign_id: campaignDropdown,
    contact_id: contactIdProp(
      'The Arteemis contact ID, e.g. `5b8f1c7e-2a4d-4e8b-9c3f-1d2e3f4a5b6c`, from **Create or Update Contact** or **Find Contact**. The contact needs an email or a LinkedIn profile.'
    ),
  },
  async run(context) {
    const contactId = context.propsValue.contact_id.trim();
    const campaignId = context.propsValue.campaign_id;
    // campaigns_enroll runs as a background job: the contact is in the campaign within seconds.
    const response = await arteemisApi.call<{ id: string; status: string }>({
      apiKey: context.auth.secret_text,
      tool: 'campaigns_enroll',
      body: { campaign_id: campaignId, contact_ids: [contactId] },
    });
    return {
      campaign_id: campaignId,
      contact_id: contactId,
      job_id: response.job_id ?? response.data.id,
      job_status: response.data.status,
    };
  },
});
