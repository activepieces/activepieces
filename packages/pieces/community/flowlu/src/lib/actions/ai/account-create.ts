import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluOutput } from '../../common/utils';
import { accountCreateOutputSchema } from '../../output-schemas';

export const flowluAccountCreate = createAction({
  auth: flowluAuth,
  name: 'flowlu_account_create',
  classification: 'WRITE',
  displayName: 'Create CRM Account',
  description: 'Creates a CRM contact or organization in Flowlu.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Flowlu CRM account, either a contact (person, needs first_name) or an organization (company, needs name), chosen by account_type. Use to add a person or company to the CRM; search with flowlu_find_accounts first to avoid duplicates. Not idempotent: each call creates a new account.',
    idempotent: false,
  },
  props: {
    account_type: Property.StaticDropdown({
      displayName: 'Account Type',
      description: 'contact for a person, organization for a company.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Contact (person)', value: 'contact' },
          { label: 'Organization (company)', value: 'organization' },
        ],
      },
    }),
    ...flowluAiProps.account(),
  },
  outputSchema: accountCreateOutputSchema,
  async run(context) {
    const accountType = context.propsValue.account_type;
    if (accountType !== 'contact' && accountType !== 'organization') {
      throw new FlowluApiError({
        message: 'Account Type must be "contact" or "organization".',
      });
    }
    const body = flowluAiBody.account(context.propsValue);
    if (accountType === 'contact' && body['first_name'] === undefined) {
      throw new FlowluApiError({
        message: 'First Name is required to create a contact.',
      });
    }
    if (accountType === 'organization' && body['name'] === undefined) {
      throw new FlowluApiError({
        message: 'Organization Name is required to create an organization.',
      });
    }
    const client = makeClient(context.auth);
    const created = await client.createRecord('crm', 'account', {
      ...body,
      type: accountType === 'contact' ? 2 : 1,
    });
    return flowluOutput.fullRecord({
      client,
      module: 'crm',
      entity: 'account',
      created,
    });
  },
});
