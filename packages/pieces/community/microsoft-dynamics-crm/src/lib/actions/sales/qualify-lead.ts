import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { qualifyLeadOutputSchema } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const qualifyLeadAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'qualify_lead',
  classification: 'WRITE',
  displayName: 'Qualify Lead',
  description:
    'Qualifies a lead and optionally creates an account, contact and opportunity from it. The lead is closed as Qualified.',
  audience: 'human',
  aiMetadata: {
    description:
      'Qualifies an open Dynamics 365 lead, closing it and creating the chosen account, contact and opportunity. Not idempotent: a qualified lead cannot be qualified again.',
    idempotent: false,
  },
  props: {
    leadId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'leads',
      displayName: 'Lead',
      description: 'The open lead to qualify. Type to search by name, or map a lead ID.',
      required: true,
    }),
    createAccount: Property.Checkbox({
      displayName: 'Create Account',
      description: 'Create an account from the lead company name. If the lead already has a parent account, Dynamics links that account and creates none, so Account ID can be empty.',
      required: false,
      defaultValue: true,
    }),
    createContact: Property.Checkbox({
      displayName: 'Create Contact',
      description: 'Create a contact from the lead person.',
      required: false,
      defaultValue: true,
    }),
    createOpportunity: Property.Checkbox({
      displayName: 'Create Opportunity',
      description: 'Create an opportunity from the lead.',
      required: false,
      defaultValue: true,
    }),
    existingAccountId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'accounts',
      displayName: 'Opportunity Customer (Existing Account)',
      description: 'Optional. Use this existing account as the customer of the new opportunity instead of a new one. It is also set on the opportunity after qualifying, because Dynamics otherwise uses the new contact.',
      required: false,
    }),
  },
  outputSchema: qualifyLeadOutputSchema,
  async run(context) {
    const { leadId, createAccount, createContact, createOpportunity, existingAccountId } = context.propsValue;
    const id = odata.requireGuid({ value: leadId, label: 'Lead' });
    return await salesEntities.qualifyLead({
      client: makeClient(context.auth),
      leadId: id,
      createAccount: createAccount !== false,
      createContact: createContact !== false,
      createOpportunity: createOpportunity !== false,
      existingAccountId: dynamicsProps.readString(existingAccountId),
    });
  },
});
