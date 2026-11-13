import { createAction, Property } from '@activepieces/pieces-framework';
import { addContactToWorkflow, getWorkflows } from '../common';
import { leadConnectorProps } from '../common/props';
import { leadConnectorAuth } from '../..';

export const addContactToWorkflowAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_contact_to_workflow',
  classification: 'WRITE',
  displayName: 'Add Contact to Workflow',
  description: 'Add an existing contact to a workflow.',
  audience: 'both',
  aiMetadata: { description: 'Enrolls an existing GoHighLevel/LeadConnector contact into an automation workflow by contact ID and workflow ID. Use to trigger a workflow sequence for a known contact. Not idempotent — each call re-enrolls the contact.', idempotent: false },
  props: {
    contact: leadConnectorProps.contact({ required: true }),
    workflow: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Workflow',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }

        const campaigns = await getWorkflows(auth);
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
