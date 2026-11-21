import { createAction, Property } from '@activepieces/pieces-framework';
import {
  fetchCampaigns,
  addLeadsToCampaign,
  reachinboxCommon,
} from '../common/index';
import { ReachinboxAuth } from '../..';
import { reachinbox } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Define the structure for custom variables
interface CustomVariable {
  key: string;
  value: string;
}

export const addLeads = createAction({
  auth: ReachinboxAuth,
  name: 'addLeads',
  classification: 'WRITE',
  displayName: 'Add Lead to Campaign',
  description: 'Adds a lead to a campaign, with optional custom variables.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a single lead (email plus name and optional custom variables) to a specific ReachInbox campaign. Use to enroll a new contact into an outreach sequence. Requires a campaign id; not idempotent since repeated calls append the lead again.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'lead',
      display: 'section',
      label: 'Lead',
      icon: 'user',
      props: ['campaignId', 'email', 'firstName', 'lastName'],
    },
    {
      key: 'variables',
      display: 'section',
      label: 'Personalization',
      icon: 'tag',
      props: ['customVariables'],
    },
  ],
  props: {
    campaignId: Property.Dropdown({
      auth: ReachinboxAuth,
      displayName: 'Campaign',
      description: 'Your campaigns, newest first.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const campaigns = await fetchCampaigns(auth.secret_text);
          if (campaigns.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No campaigns found. Create one in ReachInbox first.',
            };
          }
          return {
            options: campaigns.map((campaign) => ({
              label: reachinboxCommon.campaignLabel(campaign),
              value: campaign.id.toString(),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load campaigns. Check your connection.',
          };
        }
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      required: true,
      width: 'half',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      required: false,
      width: 'half',
    }),
    customVariables: Property.Array({
      displayName: 'Custom Variables',
      description: 'Extra fields to use as variables in your emails.',
      properties: {
        key: Property.ShortText({
          displayName: 'Name',
          placeholder: 'company',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          placeholder: 'Acme Inc',
          required: true,
        }),
      },
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    const { campaignId, email, firstName, lastName } = context.propsValue;

    // Safely cast customVariables to CustomVariable[], default to an empty array if undefined
    const customVariables: CustomVariable[] = (context.propsValue
      .customVariables || []) as CustomVariable[];

    // Process the custom variables into a key-value object for each lead
    const customVariablesObject: Record<string, string> = {};
    customVariables.forEach((variable: CustomVariable) => {
      customVariablesObject[variable.key] = variable.value;
    });

    // Include the custom variables in the lead data
    const body = {
      campaignId,
      leads: [{ email, firstName, lastName, ...customVariablesObject }],
      newCoreVariables: [
        'firstName',
        ...customVariables.map((varObj: CustomVariable) => varObj.key),
      ],
      duplicates: [],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${reachinboxCommon.baseUrl}leads/add`,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Leads added successfully.',
          leadCount: response.body.leadCount,
        };
      } else {
        throw new Error(`Failed to add leads: ${response.body.message}`);
      }
    } catch (error) {
      console.error('Error adding leads:', error);
      throw new Error('Failed to add leads to the campaign.');
    }
  },
});
