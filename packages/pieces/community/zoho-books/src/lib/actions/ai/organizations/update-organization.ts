import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksClient } from '../../../common/client';

const FISCAL_MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export const updateOrganizationAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_organization',
  displayName: 'Update Organization',
  description: 'Updates the details of a Zoho Books organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an organization; only the fields given are sent. Needs the admin role in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Organization ID, from List Organizations.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Organization name.',
      required: false,
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Name of the organization contact person.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the organization contact person.',
      required: false,
    }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'Time zone, e.g. "PST".',
      required: false,
    }),
    dateFormat: Property.ShortText({
      displayName: 'Date Format',
      description: 'Date format, e.g. "dd MMM yyyy".',
      required: false,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Language code, e.g. "en".',
      required: false,
    }),
    fiscalYearStartMonth: Property.StaticDropdown({
      displayName: 'Fiscal Year Start Month',
      required: false,
      options: {
        options: FISCAL_MONTHS.map((month) => ({ label: month, value: month })),
      },
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other organization fields, e.g. {"address": {"street_address1": "...", "city": "..."}, "currency_id": "...", "taxid_label": "...", "taxid_value": "...", "custom_fields": [{"index": 1, "value": "..."}]}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      organizationId,
      name,
      contactName,
      email,
      phone,
      website,
      timeZone,
      dateFormat,
      languageCode,
      fiscalYearStartMonth,
      additionalFields,
    } = context.propsValue;
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/organizations/${encodeURIComponent(organizationId)}`,
      body: {
        ...additionalFields,
        ...spreadIfDefined('name', name),
        ...spreadIfDefined('contact_name', contactName),
        ...spreadIfDefined('email', email),
        ...spreadIfDefined('phone', phone),
        ...spreadIfDefined('website', website),
        ...spreadIfDefined('time_zone', timeZone),
        ...spreadIfDefined('date_format', dateFormat),
        ...spreadIfDefined('language_code', languageCode),
        ...spreadIfDefined('fiscal_year_start_month', fiscalYearStartMonth),
      },
    });
  },
});
