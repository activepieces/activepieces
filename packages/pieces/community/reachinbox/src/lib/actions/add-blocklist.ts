import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..'; // Ensure proper authentication setup
import { reachinboxCommon } from '../common';

export const addBlocklist = createAction({
  auth: ReachinboxAuth,
  name: 'addBlocklist',
  displayName: 'Add Blocklist',
  description: 'Add email addresses, domains, and keywords to the blocklist.',
  props: {
    emails: Property.Array({
      displayName: 'Email Addresses',
      description:
        'Enter the email addresses to block (e.g., ["abc@gmail.com"])',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'Enter the domains to block (e.g., ["example.com"])',
      required: false,
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      description: 'Enter keywords to block (e.g., ["spam", "blacklist"])',
      required: false,
    }),
  },
  async run(context) {
    const { emails, domains, keywords } = context.propsValue;

    // Ensure at least one of emails, domains, or keywords is provided
    if (!emails?.length && !domains?.length && !keywords?.length) {
      throw new Error(
        'Please provide at least one email, domain, or keyword to block.'
      );
    }

    const body = {
      emails: emails || [],
      domains: domains || [],
      keywords: keywords || [],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${reachinboxCommon.baseUrl}blocklist/add`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Blocklist updated successfully.',
        };
      } else {
        throw new Error(`Failed to update blocklist: ${response.body.message}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error updating blocklist: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred while updating the blocklist.');
      }
    }
  },
});
