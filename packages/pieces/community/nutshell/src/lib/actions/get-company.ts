import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const getCompany = createAction({
  auth: nutshellAuth,
  name: 'getCompany',
  displayName: 'Get Company',
  description: 'Retrieves a company (account) by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Nutshell company by its ID. Use to look up the current details of a known company. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to retrieve, e.g. "123-accounts".',
      required: true,
    }),
  },
  async run(context) {
    const { companyId } = context.propsValue;
    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/accounts/${companyId}`,
    });
    return unwrapFirst(response, 'accounts');
  },
});
