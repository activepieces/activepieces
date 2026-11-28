import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { qualifyLeadOutputSchema } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const aiQualifyLeadAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_qualify_lead',
  classification: 'WRITE',
  displayName: 'Qualify Lead',
  description: 'Qualifies a lead into an account, contact and opportunity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Qualifies an open Dynamics 365 lead: closes it as Qualified and creates the chosen account, contact and opportunity, returning their IDs (accountId is null when the lead already had a parent account and none was created; with existingAccountId it is that account, set as the opportunity customer). Not idempotent: a qualified lead cannot be qualified again.',
    idempotent: false,
  },
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'GUID of the open lead.',
      required: true,
    }),
    createAccount: Property.StaticDropdown<string>({
      displayName: 'Create Account',
      description: 'Create an account from the lead company name. If the lead already has a parent account, Dynamics links that account and creates none, so accountId can be empty.',
      required: false,
      defaultValue: 'yes',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    createContact: Property.StaticDropdown<string>({
      displayName: 'Create Contact',
      description: 'Create a contact from the lead.',
      required: false,
      defaultValue: 'yes',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    createOpportunity: Property.StaticDropdown<string>({
      displayName: 'Create Opportunity',
      description: 'Create an opportunity from the lead.',
      required: false,
      defaultValue: 'yes',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    existingAccountId: Property.ShortText({
      displayName: 'Existing Account ID',
      description: 'Optional account GUID to set as the customer of the new opportunity (applied after qualifying, and returned as accountId).',
      required: false,
    }),
  },
  outputSchema: qualifyLeadOutputSchema,
  async run(context) {
    const { leadId, createAccount, createContact, createOpportunity, existingAccountId } = context.propsValue;
    const id = odata.requireGuid({ value: leadId, label: 'Lead ID' });
    return await salesEntities.qualifyLead({
      client: makeClient(context.auth),
      leadId: id,
      createAccount: odata.readYesNo({ value: createAccount, fallback: true }),
      createContact: odata.readYesNo({ value: createContact, fallback: true }),
      createOpportunity: odata.readYesNo({ value: createOpportunity, fallback: true }),
      existingAccountId: existingAccountId?.trim() || undefined,
    });
  },
});
