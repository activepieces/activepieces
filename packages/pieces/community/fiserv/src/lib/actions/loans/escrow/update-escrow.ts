import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const updateEscrow = createAction({
  name: 'escrow_update',
  displayName: 'Escrow - Update',
  description: 'Update escrow account information in Fiserv',
  auth: fiservAuth,
  props: {
    escrowId: Property.ShortText({
      displayName: 'Escrow ID',
      description: 'The ID of the escrow account to update',
      required: true,
    }),

    monthlyPayment: Property.Number({
      displayName: 'Monthly Payment',
      description: 'Updated monthly escrow payment amount',
      required: false,
    }),

    targetBalance: Property.Number({
      displayName: 'Target Balance',
      description: 'Updated target escrow balance',
      required: false,
    }),

    payee: Property.ShortText({
      displayName: 'Payee',
      description: 'Updated payee name',
      required: false,
    }),

    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Update escrow account status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Suspended', value: 'Suspended' },
        ],
      },
    }),
  },

  async run(context) {
    const { escrowId, monthlyPayment, targetBalance, payee, status } =
      context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      EscrowKeys: {
        EscrowId: escrowId,
      },
    };

    // Build update fields
    const updateFields: any = {};

    if (monthlyPayment !== undefined && monthlyPayment !== null) {
      updateFields.MonthlyPayment = monthlyPayment;
    }
    if (targetBalance !== undefined && targetBalance !== null) {
      updateFields.TargetBalance = targetBalance;
    }
    if (payee) {
      updateFields.Payee = payee;
    }
    if (status) {
      updateFields.Status = status;
    }

    if (Object.keys(updateFields).length > 0) {
      requestBody.EscrowInfo = updateFields;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.ESCROW_UPDATE,
      requestBody
    );

    return response.body;
  },
});
