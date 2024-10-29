import { createAction, Property } from '@activepieces/pieces-framework';
import {
  fetchCampaigns,
  addLeadsToCampaign,
  reachinboxCommon,
} from '../common/index';
import { reachinbox, ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Define the structure for custom variables
interface CustomVariable {
  key: string;
  value: string;
}

export const addLeads = createAction({
  auth: ReachinboxAuth,
  name: 'addLeads',
  displayName: 'Add Leads',
  description:
    'Add leads to campaigns dynamically by selecting a campaign, entering lead details, and including custom variables.',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Select Campaign',
      description: 'Choose a campaign from the list.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const campaigns = await fetchCampaigns(auth as string);

        return {
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id.toString(),
          })),
          disabled: campaigns.length === 0,
        };
      },
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Enter the email address for the lead',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Enter the first name for the lead',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Enter the last name for the lead',
      required: false,
    }),
    customVariables: Property.Array({
      displayName: 'Custom Variables',
      description: 'Add custom variables as key-value pairs for the lead.',
      properties: {
        key: Property.ShortText({
          displayName: 'Key',
          description: 'Enter the key for the custom variable',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Enter the value for the custom variable',
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
          Authorization: `Bearer ${context.auth}`,
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
