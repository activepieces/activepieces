import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..'; // Ensure proper authentication setup
import { reachinboxCommon } from '../common';

export const addBlocklist = createAction({
  auth: ReachinboxAuth,
  name: 'addBlocklist',
  classification: 'WRITE',
  displayName: 'Add to Blocklist',
  description: 'Blocks email addresses, domains or keywords from your outreach.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds email addresses, domains, and/or keywords to the ReachInbox blocklist so matching leads are excluded from outreach. Use to suppress contacts globally. At least one of emails, domains, or keywords must be provided; the call appends entries on each run.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'entries',
      display: 'section',
      label: 'Blocklist Entries',
      icon: 'filter',
      props: ['info', 'emails', 'domains', 'keywords'],
    },
  ],
  props: {
    info: Property.MarkDown({
      value: 'Fill in at least one list.',
      variant: MarkdownVariant.INFO,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Addresses that should never be contacted.',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'Every address at these domains is blocked.',
      required: false,
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
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
          Authorization: `Bearer ${context.auth.secret_text}`,
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
