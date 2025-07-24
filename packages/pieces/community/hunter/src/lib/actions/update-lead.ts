import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import { leadIdDropdown } from '../common/props';

export const updateLeadAction = createAction({
  auth: hunterIoAuth,
  name: 'update_lead',
  displayName: 'Update a Lead',
  description: 'Update the details of an existing lead by its ID.',
  props: {
    lead_id: leadIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the lead.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'The job title of the lead.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The name of the company the lead works for.',
      required: false,
    }),
    company_industry: Property.ShortText({
      displayName: 'Company Industry',
      description: 'The sector of the company.',
      required: false,
    }),
    company_size: Property.ShortText({
      displayName: 'Company Size',
      description: 'The size of the company (e.g., 10-50).',
      required: false,
    }),
    confidence_score: Property.Number({
      displayName: 'Confidence Score',
      description: 'Probability the email is correct (0-100).',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The domain name of the company.',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'The country code (ISO 3166-1 alpha-2).',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'The address of the public LinkedIn profile.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    twitter: Property.ShortText({
      displayName: 'Twitter Handle',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Personal notes about the lead.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source where the lead was found.',
      required: false,
    }),
    leads_list_id: Property.Number({
      displayName: 'Leads List ID',
      description: 'The identifier of the list the lead belongs to.',
      required: false,
    }),
    leads_list_ids: Property.Array({
      displayName: 'Leads List IDs',
      description: 'The identifiers of the lists the lead belongs to.',
      required: false,
    }),
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'Key-value pairs where the key is the attribute slug.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { lead_id, ...body } = propsValue;

    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null && value !== '') {
        fieldsToUpdate[key] = value;
      }
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.PUT,
        auth,
        resourceUri: `/leads/${lead_id}`,
        body: fieldsToUpdate,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A conflict occurred. This may be due to a duplicate email or other data conflict.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please check the format of the provided data.'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('404')) {
        throw new Error(
          'Not Found. A lead with the specified ID does not exist.'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to update lead: ${error.message}`);
    }
  },
});
