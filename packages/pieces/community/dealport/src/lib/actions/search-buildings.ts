import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import { dealportRequest } from '../common/client';

export const searchBuildingsAction = createAction({
  auth: dealportAuth,
  name: 'search-buildings',
  displayName: 'Search Commercial Buildings',
  description:
    'Search NYC multifamily and mixed-use commercial buildings across property, mortgage, and regulatory filings ($0.01 per new Record).',
  props: {
    borough: Property.StaticDropdown({
      displayName: 'NYC Borough',
      description: 'NYC borough code.',
      required: true,
      options: {
        options: [
          { label: 'Manhattan (MN)', value: 'MN' },
          { label: 'Brooklyn (BK)', value: 'BK' },
          { label: 'Queens (QN)', value: 'QN' },
          { label: 'Bronx (BX)', value: 'BX' },
          { label: 'Staten Island (SI)', value: 'SI' },
        ],
      },
    }),
    min_units: Property.Number({
      displayName: 'Minimum Residential Units',
      description: 'Minimum residential unit count (default 10).',
      required: false,
      defaultValue: 10,
    }),
    q: Property.ShortText({
      displayName: 'Address or Owner Query',
      description: 'Optional street address or owner-of-record substring match.',
      required: false,
    }),
    loan_due_by: Property.Number({
      displayName: 'Loan Maturity Year Ceiling',
      description: 'Estimated mortgage maturity year ceiling (for example 2027).',
      required: false,
    }),
    loan_holder: Property.StaticDropdown({
      displayName: 'Loan Holder Type',
      description: 'Optional mortgage holder type filter.',
      required: false,
      options: {
        options: [
          { label: 'Agency', value: 'agency' },
          { label: 'CMBS', value: 'cmbs' },
          { label: 'Bank', value: 'bank' },
        ],
      },
    }),
    signal: Property.StaticDropdown({
      displayName: 'Building Signal',
      description: 'Optional regulatory, distress, or assisted-housing signal.',
      required: false,
      options: {
        options: [
          { label: 'Rent Stabilized', value: 'rent_stabilized' },
          { label: 'DOB Penalties', value: 'dob_penalties' },
          { label: 'Housing Court', value: 'housing_court' },
          { label: 'Tax Lien', value: 'tax_lien' },
          { label: 'Local Law 97 (LL97)', value: 'll97' },
          { label: 'Section 8 Expiring', value: 'section8_expiring' },
          { label: 'Tax Abatement Ending', value: 'tax_credit_ending' },
          { label: 'Failing Inspection', value: 'failing_inspection' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Page Size',
      description: 'Number of building Records to return (1 to 50, default 25).',
      required: false,
      defaultValue: 25,
    }),
    cursor: Property.ShortText({
      displayName: 'Pagination Cursor',
      description: 'Optional pagination cursor from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const limit = props.limit ?? 25;
    if (limit < 1 || limit > 50) {
      throw new Error('Page Size must be between 1 and 50.');
    }
    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/buildings',
      queryParams: {
        borough: props.borough,
        min_units: props.min_units,
        q: props.q?.trim(),
        loan_due_by: props.loan_due_by,
        loan_holder: props.loan_holder,
        signal: props.signal,
        limit,
        cursor: props.cursor?.trim(),
      },
    });
  },
});
