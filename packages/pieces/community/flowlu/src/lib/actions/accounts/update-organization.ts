import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps, flowluWire } from '../../common/props';
import { flowluInput } from '../../common/utils';
import { accountOutputSchema } from '../../output-schemas';

export const updateOrganizationAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_organization',
  classification: 'WRITE',
  displayName: 'Update CRM Account(Organization)',
  description: 'Updates an existing organization in CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on an existing CRM organization in Flowlu picked from a list. Only filled fields are sent; the account type is never changed. For agents use flowlu_account_update. Idempotent: repeating the same update leaves the organization unchanged.',
    idempotent: true,
  },
  props: {
    id: flowluCommon.organization_id(true, 'Organization'),
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: false,
    }),
    name_legal_full: Property.ShortText({
      displayName: 'Full legal name for Organization',
      required: false,
    }),
    ...flowluProps.account,
  },
  outputSchema: accountOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.id,
      name: 'Organization',
    });
    return makeClient(context.auth).updateRecord(
      'crm',
      'account',
      id,
      flowluWire.account(context.propsValue)
    );
  },
});
