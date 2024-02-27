import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { addContactToWorkflow, getContacts, getWorkflows } from '../common';
import { leadConnectorAuth } from '../..';

export const addContactToWorkflowAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_contact_to_workflow',
  displayName: 'Add Contact to Workflow',
  description: 'Add an existing contact to a workflow.',
  props: {
    contact: Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const contacts = await getContacts(auth as OAuth2PropertyValue);
        return {
          options: contacts.map((contact) => {
            return {
              label: contact.contactName,
              value: contact.id,
            };
          }),
        };
      },
    }),
    workflow: Property.Dropdown({
      displayName: 'Workflow',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        const campaigns = await getWorkflows(auth as OAuth2PropertyValue);
        return {
          options: campaigns.map((campaign: any) => {
            return {
              label: campaign.name,
              value: campaign.id,
            };
          }),
        };
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, workflow } = propsValue;

    return await addContactToWorkflow(auth.access_token, contact, workflow);
  },
});
