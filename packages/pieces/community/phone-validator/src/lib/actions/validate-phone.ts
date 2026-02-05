import { createAction, Property } from '@activepieces/pieces-framework';
import { phoneValidatorAuth } from '../../lib/common/auth';
import { PhoneValidatorClient } from '../../lib/common/client';

export const validatePhone = createAction({
  auth: phoneValidatorAuth,
  name: 'validatePhone',
  displayName: 'Validate Phone Number',
  description: 'Validate a phone number and retrieve line type, carrier, and location information',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to validate (e.g., 7029270000, 1-702-927-0000)',
      required: true,
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of phone lookup to perform',
      required: true,
      options: {
        options: [
          {
            label: 'Basic (Line Type + Carrier + Location + Fake Check)',
            value: 'basic',
          },
          {
            label: 'Fake Number Check Only',
            value: 'fake',
          },
        ],
      },
      defaultValue: 'basic',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new PhoneValidatorClient(auth.secret_text);
    const response = await client.validatePhone(propsValue.phoneNumber, propsValue.searchType as 'basic' | 'fake');

    if (response.StatusCode === '200') {
      const result: any = {
        phoneNumber: response.PhoneNumber,
        cost: response.Cost,
        searchDate: response.SearchDate,
        statusCode: response.StatusCode,
        statusMessage: response.StatusMessage,
      };

      if (response.PhoneBasic) {
        result.phoneBasic = {
          phoneNumber: response.PhoneBasic.PhoneNumber,
          reportDate: response.PhoneBasic.ReportDate,
          lineType: response.PhoneBasic.LineType,
          phoneCompany: response.PhoneBasic.PhoneCompany,
          phoneLocation: response.PhoneBasic.PhoneLocation,
          fakeNumber: response.PhoneBasic.FakeNumber,
          fakeNumberReason: response.PhoneBasic.FakeNumberReason || response.PhoneBasic.FakeReason || '',
          errorCode: response.PhoneBasic.ErrorCode,
          errorDescription: response.PhoneBasic.ErrorDescription,
        };
      }

      return result;
    }

    return response;
  },
});
