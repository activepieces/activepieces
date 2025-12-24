import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const updateCollateral = createAction({
  name: 'collateral_update',
  displayName: 'Collateral - Update',
  description: 'Update collateral information in Fiserv',
  auth: fiservAuth,
  props: {
    collateralId: Property.ShortText({
      displayName: 'Collateral ID',
      description: 'The ID of the collateral to update',
      required: true,
    }),

    description: Property.LongText({
      displayName: 'Description',
      description: 'Updated description of the collateral',
      required: false,
    }),

    estimatedValue: Property.Number({
      displayName: 'Estimated Value',
      description: 'Updated estimated value of the collateral',
      required: false,
    }),

    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Update collateral status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Released', value: 'Released' },
          { label: 'Under Review', value: 'UnderReview' },
        ],
      },
    }),
  },

  async run(context) {
    const { collateralId, description, estimatedValue, status } =
      context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      CollateralKeys: {
        CollateralId: collateralId,
      },
    };

    // Build update fields
    const updateFields: any = {};

    if (description) {
      updateFields.Description = description;
    }
    if (estimatedValue !== undefined && estimatedValue !== null) {
      updateFields.EstimatedValue = estimatedValue;
    }
    if (status) {
      updateFields.Status = status;
    }

    if (Object.keys(updateFields).length > 0) {
      requestBody.CollateralInfo = updateFields;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.COLLATERAL_UPDATE,
      requestBody
    );

    return response.body;
  },
});
