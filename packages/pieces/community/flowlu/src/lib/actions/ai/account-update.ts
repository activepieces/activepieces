import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluInput } from '../../common/utils';
import { accountOutputSchema } from '../../output-schemas';

export const flowluAccountUpdate = createAction({
  auth: flowluAuth,
  name: 'flowlu_account_update',
  classification: 'WRITE',
  displayName: 'Update CRM Account',
  description: 'Updates fields on a CRM contact or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you pass on one Flowlu CRM account (contact or organization), identified by account_id; omitted fields keep their value and the account type never changes. Use to correct names, phones, website, owner or address. Requires at least one field. Idempotent: repeating the same update leaves the account unchanged.',
    idempotent: true,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Numeric ID of the contact or organization, such as "42". Get it from flowlu_find_accounts.',
      required: true,
    }),
    ...flowluAiProps.account(),
  },
  outputSchema: accountOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.account_id,
      name: 'Account ID',
    });
    const body = flowluAiBody.account(context.propsValue);
    if (Object.keys(body).length === 0) {
      throw new FlowluApiError({
        message: 'Nothing to update: pass at least one field to change.',
      });
    }
    return makeClient(context.auth).updateRecord('crm', 'account', id, body);
  },
});
