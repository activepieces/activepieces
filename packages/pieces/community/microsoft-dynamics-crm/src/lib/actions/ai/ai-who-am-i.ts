import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { whoAmIOutputSchema } from '../../common/output-schemas';

export const aiWhoAmIAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_who_am_i',
  classification: 'READ',
  displayName: 'Who Am I',
  description: 'Returns the connected user and business unit IDs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected Dynamics 365 user ID, business unit and organization, for owner binds (ownerid@odata.bind: /systemusers(<userId>)) or "my records" filters (_ownerid_value eq <userId>). Read-only.',
    idempotent: true,
  },
  props: {

  },
  outputSchema: whoAmIOutputSchema,
  async run(context) {
    const client = makeClient(context.auth);
    const me = await client.whoAmI();
    const user = await client.getRecord({ entitySet: 'systemusers', recordId: me.UserId, select: ['fullname', 'internalemailaddress'] });
    return {
      userId: me.UserId,
      businessUnitId: me.BusinessUnitId,
      organizationId: me.OrganizationId,
      fullName: typeof user['fullname'] === 'string' ? user['fullname'] : null,
      email: typeof user['internalemailaddress'] === 'string' ? user['internalemailaddress'] : null,
    };
  },
});
