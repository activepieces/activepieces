import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const deleteEscrow = createAction({
  name: 'escrow_delete',
  displayName: 'Escrow - Delete',
  description: 'Delete escrow account from a loan in Fiserv',
  auth: fiservAuth,
  props: {
    escrowId: Property.ShortText({
      displayName: 'Escrow ID',
      description: 'The ID of the escrow account to delete',
      required: true,
    }),

    reason: Property.LongText({
      displayName: 'Deletion Reason',
      description: 'Reason for deleting the escrow account',
      required: false,
    }),

    disburseFunds: Property.Checkbox({
      displayName: 'Disburse Remaining Funds',
      description: 'Disburse any remaining escrow balance to borrower',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { escrowId, reason, disburseFunds } = context.propsValue;
    const auth = context.auth as any;

    const requestBody: any = {
      EscrowKeys: {
        EscrowId: escrowId,
      },
      DisburseFunds: disburseFunds,
    };

    if (reason) {
      requestBody.DeletionReason = reason;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.ESCROW_DELETE,
      requestBody
    );

    return response.body;
  },
});
