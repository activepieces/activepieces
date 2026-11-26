import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Define the structure for custom variables
interface CustomVariable {
  key: string;
  value: string;
}

// Define the updateLead action
export const updateLead = createAction({
  auth: ReachinboxAuth,
  name: 'updateLead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: "Sets a lead's email, name and the custom variables you list.",
  audience: 'both',
  aiMetadata: {
    description:
      "Updates an existing lead in a ReachInbox campaign, overwriting its email, name, and custom-variable attributes. Use to modify a known contact's details. Requires both the campaign id and the lead id; idempotent since it sets the lead to the supplied values.",
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'lead',
      display: 'section',
      label: 'Lead to Update',
      icon: 'user',
      props: ['campaignId', 'leadId'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'New Details',
      icon: 'text',
      props: ['info', 'email', 'firstName', 'lastName', 'customVariables'],
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
              value: campaign.id,
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
    leadId: Property.Dropdown({
      auth: ReachinboxAuth,
      displayName: 'Lead',
      description: 'Leads of the selected campaign, listed by email.',
      required: true,
      refreshers: ['campaignId'],
      options: async ({ auth, campaignId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        if (!campaignId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a campaign first',
          };
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${reachinboxCommon.baseUrl}leads?campaignId=${campaignId}&lastLead=false`,
          headers: {
            Authorization: `Bearer ${auth.secret_text}`,
          },
        });

        if (response.status !== 200) {
          throw new Error('Failed to fetch leads.');
        }

        const leads = Array.isArray(response.body.data.leads)
          ? response.body.data.leads
          : [];

        if (leads.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No leads in this campaign.',
          };
        }

        return {
          options: leads.map((lead: { email: string; id: string }) => ({
            label: lead.email,
            value: lead.id,
          })),
        };
      },
    }),
    info: Property.MarkDown({
      value: 'Empty First Name or Last Name fields clear that name on the lead.',
      variant: MarkdownVariant.INFO,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The lead's email address after the update.",
      placeholder: 'jane@example.com',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      required: false,
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
    const { campaignId, leadId, email, firstName, lastName, customVariables } =
      context.propsValue;

    if (!campaignId || !leadId) {
      throw new Error('Campaign ID and Lead ID are required.');
    }

    // Safely cast customVariables to CustomVariable[], default to an empty array if undefined
    const customVariablesArray: CustomVariable[] = (customVariables ||
      []) as CustomVariable[];

    // Process the custom variables into a key-value object for the lead attributes
    const customVariablesObject: Record<string, string> = {};
    customVariablesArray.forEach((variable: CustomVariable) => {
      customVariablesObject[variable.key] = variable.value;
    });

    // Include the custom variables in the lead update request
    const url = `${reachinboxCommon.baseUrl}leads/update`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: url,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
          'Content-Type': 'application/json',
        },
        body: {
          campaignId: campaignId,
          leadId: leadId,
          email: email,
          attributes: {
            firstName: firstName || '',
            lastName: lastName || '',
            ...customVariablesObject, // Add custom variables dynamically
          },
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Lead updated successfully.',
        };
      } else {
        throw new Error(`Failed to update lead: ${response.body.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  },
});
