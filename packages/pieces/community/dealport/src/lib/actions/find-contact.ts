import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import { assertValidCompanyUuid, dealportRequest } from '../common/client';

export const findContactAction = createAction({
  auth: dealportAuth,
  name: 'find-contact',
  displayName: 'Find Contact by Role',
  description:
    'Find verified principal phones, emails, and professional profile for a Dealport company Record ($0.09 per verified hit, $0.00 miss).',
  props: {
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Dealport company UUID.',
      required: true,
    }),
    person: Property.ShortText({
      displayName: 'Principal Name',
      description: 'Optional full name of a specific principal on the company Record.',
      required: false,
    }),
  },
  async run(context) {
    const companyId = assertValidCompanyUuid(context.propsValue.company_id);
    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts',
      body: {
        company_id: companyId,
        person: context.propsValue.person?.trim(),
      },
    });
  },
});
