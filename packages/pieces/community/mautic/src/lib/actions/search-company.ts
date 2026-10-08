import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';

export const searchCompanyAction = createAction({
  auth: mauticAuth,
  description: 'Search for a company in Mautic CRM',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a company in Mautic by matching the supplied field values (combined into a search query), returning the first matching company. Use to find a company or resolve its id before updating, or to verify whether an organization already exists before creating one. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Search Company',
  name: 'search_mautic_company',
  classification: 'SEARCH',
  props: {
    fields: mauticProps.companyFields({ required: true }),
  },
  run: async function (context) {
    const response = await mauticApi.searchCompanies({ auth: context.auth, fields: context.propsValue.fields });
    return Object.values(response.companies)[0];
  },
});
