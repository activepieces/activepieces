import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS, CollateralType } from '../../../common/constants';

export const addCollateral = createAction({
  name: 'collateral_add',
  displayName: 'Collateral - Add',
  description: 'Add collateral to a loan in Fiserv',
  auth: fiservAuth,
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to add collateral to',
      required: true,
    }),

    collateralType: Property.StaticDropdown({
      displayName: 'Collateral Type',
      description: 'Type of collateral',
      required: true,
      options: {
        options: [
          { label: 'Real Estate', value: CollateralType.REAL_ESTATE },
          { label: 'Vehicle', value: CollateralType.VEHICLE },
          { label: 'Equipment', value: CollateralType.EQUIPMENT },
          { label: 'Securities', value: CollateralType.SECURITIES },
          { label: 'Cash', value: CollateralType.CASH },
          { label: 'Other', value: CollateralType.OTHER },
        ],
      },
    }),

    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the collateral',
      required: true,
    }),

    estimatedValue: Property.Number({
      displayName: 'Estimated Value',
      description: 'Estimated value of the collateral',
      required: true,
    }),

    propertyAddress: Property.LongText({
      displayName: 'Property Address',
      description: 'Address of the collateral (for real estate)',
      required: false,
    }),

    vinNumber: Property.ShortText({
      displayName: 'VIN Number',
      description: 'Vehicle Identification Number (for vehicles)',
      required: false,
    }),
  },

  async run(context) {
    const {
      loanId,
      collateralType,
      description,
      estimatedValue,
      propertyAddress,
      vinNumber,
    } = context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      LoanKeys: {
        LoanId: loanId,
      },
      CollateralInfo: {
        CollateralType: collateralType,
        Description: description,
        EstimatedValue: estimatedValue,
      },
    };

    // Add optional fields based on collateral type
    if (propertyAddress && collateralType === CollateralType.REAL_ESTATE) {
      requestBody.CollateralInfo.PropertyAddress = propertyAddress;
    }

    if (vinNumber && collateralType === CollateralType.VEHICLE) {
      requestBody.CollateralInfo.VINNumber = vinNumber;
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.COLLATERAL_ADD,
      requestBody
    );

    return response.body;
  },
});
