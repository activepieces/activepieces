import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingDropdowns } from './dropdowns';
import { sageAccountingClient, SageAccountingRef } from '../client';

export async function putContactDetailsOrRollback({
  accessToken,
  contactId,
  detailFields,
}: {
  accessToken: string;
  contactId: string;
  detailFields: Record<string, unknown>;
}): Promise<SageAccountingRef> {
  try {
    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.contacts}/${contactId}`,
      body: { contact: detailFields },
    });
  } catch (error) {
    await sageAccountingClient
      .apiCall({ accessToken, method: HttpMethod.DELETE, path: `${sageAccountingClient.paths.contacts}/${contactId}` })
      .catch(() => undefined);
    throw error;
  }
}

export const contactDetailProps = {
  reference: Property.ShortText({
    displayName: 'Reference',
    description: 'A unique reference for the contact, e.g. "CUST-002".',
    required: false,
  }),
  notes: Property.LongText({ displayName: 'Notes', required: false }),
  creditLimit: Property.Number({ displayName: 'Credit Limit', required: false }),
  creditDays: Property.Number({
    displayName: 'Credit Term Days',
    description: 'Number of days before an invoice or bill is due.',
    required: false,
    advanced: true,
  }),
  taxNumber: Property.ShortText({
    displayName: 'Tax Number',
    description: 'The contact\'s VAT registration number.',
    required: false,
    advanced: true,
  }),
  productSalesPriceType: sageAccountingDropdowns.productSalesPriceTypeId,

  mainAddressName: Property.ShortText({ displayName: 'Main Address Name', required: false }),
  mainAddressLine1: Property.ShortText({ displayName: 'Main Address Line 1', required: false }),
  mainAddressLine2: Property.ShortText({ displayName: 'Main Address Line 2', required: false }),
  mainAddressCity: Property.ShortText({ displayName: 'Main Address City', required: false }),
  mainAddressRegion: Property.ShortText({ displayName: 'Main Address Region', required: false }),
  mainAddressPostalCode: Property.ShortText({ displayName: 'Main Address Postal Code', required: false }),
  mainAddressCountry: sageAccountingDropdowns.countryId,
  mainAddressCountryGroup: sageAccountingDropdowns.countryGroupId,

  deliveryAddressName: Property.ShortText({ displayName: 'Delivery Address Name', required: false }),
  deliveryAddressLine1: Property.ShortText({ displayName: 'Delivery Address Line 1', required: false }),
  deliveryAddressLine2: Property.ShortText({ displayName: 'Delivery Address Line 2', required: false }),
  deliveryAddressCity: Property.ShortText({ displayName: 'Delivery City', required: false }),
  deliveryAddressRegion: Property.ShortText({ displayName: 'Delivery Region', required: false }),
  deliveryAddressPostalCode: Property.ShortText({ displayName: 'Delivery Postal Code', required: false }),
  deliveryAddressCountry: sageAccountingDropdowns.countryId,
  deliveryAddressCountryGroup: sageAccountingDropdowns.countryGroupId,

  contactPersonName: Property.ShortText({ displayName: 'Main Contact Name', required: false }),
  jobTitle: Property.ShortText({ displayName: 'Main Contact Job Title', required: false }),
  email: Property.ShortText({ displayName: 'Main Contact Email', required: false }),
  telephone: Property.ShortText({ displayName: 'Main Contact Telephone', required: false }),
  mobile: Property.ShortText({ displayName: 'Main Contact Mobile', required: false }),
  fax: Property.ShortText({ displayName: 'Main Contact Fax', required: false }),

  bankAccountName: Property.ShortText({ displayName: 'Bank Account Name', required: false }),
  bankAccountNumber: Property.ShortText({ displayName: 'Bank Account Number', required: false }),
  bankSortCode: Property.ShortText({ displayName: 'Bank Account Sort Code', required: false }),
  bankBic: Property.ShortText({ displayName: 'Bank Account BIC', required: false }),
  bankIban: Property.ShortText({ displayName: 'Bank Account IBAN', required: false }),
};

export const contactPropertyGroups = [
  {
    key: 'mainAddress',
    display: 'section' as const,
    label: 'Main Address',
    icon: 'send' as const,
    props: [
      'mainAddressName',
      'mainAddressLine1',
      'mainAddressLine2',
      'mainAddressCity',
      'mainAddressRegion',
      'mainAddressPostalCode',
      'mainAddressCountry',
      'mainAddressCountryGroup',
    ],
  },
  {
    key: 'deliveryAddress',
    display: 'section' as const,
    label: 'Delivery Address',
    icon: 'send' as const,
    props: [
      'deliveryAddressName',
      'deliveryAddressLine1',
      'deliveryAddressLine2',
      'deliveryAddressCity',
      'deliveryAddressRegion',
      'deliveryAddressPostalCode',
      'deliveryAddressCountry',
      'deliveryAddressCountryGroup',
    ],
  },
  {
    key: 'contactPerson',
    display: 'section' as const,
    label: 'Main Contact Person',
    icon: 'user' as const,
    props: ['contactPersonName', 'jobTitle', 'email', 'telephone', 'mobile', 'fax'],
  },
  {
    key: 'bankDetails',
    display: 'section' as const,
    label: 'Bank Account Details',
    props: ['bankAccountName', 'bankAccountNumber', 'bankSortCode', 'bankBic', 'bankIban'],
  },
];

export function buildContactAddressAndDetailFields(propsValue: ContactDetailPropsValue, fallbacks: ContactNameFallbacks = {}) {
  const {
    reference, notes, creditLimit, creditDays, taxNumber, productSalesPriceType,
    mainAddressName, mainAddressLine1, mainAddressLine2, mainAddressCity, mainAddressRegion, mainAddressPostalCode, mainAddressCountry, mainAddressCountryGroup,
    deliveryAddressName, deliveryAddressLine1, deliveryAddressLine2, deliveryAddressCity, deliveryAddressRegion, deliveryAddressPostalCode, deliveryAddressCountry, deliveryAddressCountryGroup,
    contactPersonName, jobTitle, email, telephone, mobile, fax,
    bankAccountName, bankAccountNumber, bankSortCode, bankBic, bankIban,
  } = propsValue;

  const hasMainAddress = [mainAddressName, mainAddressLine1, mainAddressLine2, mainAddressCity, mainAddressRegion, mainAddressPostalCode, mainAddressCountry, mainAddressCountryGroup].some((value) => value !== undefined);
  const hasDeliveryAddress = [deliveryAddressName, deliveryAddressLine1, deliveryAddressLine2, deliveryAddressCity, deliveryAddressRegion, deliveryAddressPostalCode, deliveryAddressCountry, deliveryAddressCountryGroup].some((value) => value !== undefined);
  const hasContactPerson = [contactPersonName, jobTitle, email, telephone, mobile, fax].some((value) => value !== undefined);
  const hasBankAccountDetails = [bankAccountName, bankAccountNumber, bankSortCode, bankBic, bankIban].some((value) => value !== undefined);

  return {
    ...(reference !== undefined ? { reference } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(creditLimit !== undefined ? { credit_limit: creditLimit } : {}),
    ...(creditDays !== undefined ? { credit_days: creditDays } : {}),
    ...(taxNumber !== undefined ? { tax_number: taxNumber } : {}),
    ...(productSalesPriceType !== undefined ? { product_sales_price_type_id: productSalesPriceType } : {}),
    ...(hasMainAddress
      ? {
          main_address: {
            name: mainAddressName ?? fallbacks.mainAddressName ?? 'Main Address',
            ...(mainAddressLine1 !== undefined ? { address_line_1: mainAddressLine1 } : {}),
            ...(mainAddressLine2 !== undefined ? { address_line_2: mainAddressLine2 } : {}),
            ...(mainAddressCity !== undefined ? { city: mainAddressCity } : {}),
            ...(mainAddressRegion !== undefined ? { region: mainAddressRegion } : {}),
            ...(mainAddressPostalCode !== undefined ? { postal_code: mainAddressPostalCode } : {}),
            ...(mainAddressCountry !== undefined ? { country_id: mainAddressCountry } : {}),
            ...(mainAddressCountryGroup !== undefined ? { country_group_id: mainAddressCountryGroup } : {}),
          },
        }
      : {}),
    ...(hasDeliveryAddress
      ? {
          delivery_address: {
            name: deliveryAddressName ?? fallbacks.deliveryAddressName ?? 'Delivery Address',
            ...(deliveryAddressLine1 !== undefined ? { address_line_1: deliveryAddressLine1 } : {}),
            ...(deliveryAddressLine2 !== undefined ? { address_line_2: deliveryAddressLine2 } : {}),
            ...(deliveryAddressCity !== undefined ? { city: deliveryAddressCity } : {}),
            ...(deliveryAddressRegion !== undefined ? { region: deliveryAddressRegion } : {}),
            ...(deliveryAddressPostalCode !== undefined ? { postal_code: deliveryAddressPostalCode } : {}),
            ...(deliveryAddressCountry !== undefined ? { country_id: deliveryAddressCountry } : {}),
            ...(deliveryAddressCountryGroup !== undefined ? { country_group_id: deliveryAddressCountryGroup } : {}),
          },
        }
      : {}),
    ...(hasContactPerson
      ? {
          main_contact_person: {
            is_main_contact: true,
            ...(contactPersonName !== undefined || fallbacks.contactPersonName !== undefined
              ? { name: contactPersonName ?? fallbacks.contactPersonName }
              : {}),
            ...(jobTitle !== undefined ? { job_title: jobTitle } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(telephone !== undefined ? { telephone } : {}),
            ...(mobile !== undefined ? { mobile } : {}),
            ...(fax !== undefined ? { fax } : {}),
          },
        }
      : {}),
    ...(hasBankAccountDetails
      ? {
          bank_account_details: {
            ...(bankAccountName !== undefined ? { account_name: bankAccountName } : {}),
            ...(bankAccountNumber !== undefined ? { account_number: bankAccountNumber } : {}),
            ...(bankSortCode !== undefined ? { sort_code: bankSortCode } : {}),
            ...(bankBic !== undefined ? { bic: bankBic } : {}),
            ...(bankIban !== undefined ? { iban: bankIban } : {}),
          },
        }
      : {}),
  };
}

type ContactNameFallbacks = {
  mainAddressName?: string;
  deliveryAddressName?: string;
  contactPersonName?: string;
};

type ContactDetailPropsValue = {
  reference?: string;
  notes?: string;
  creditLimit?: number;
  creditDays?: number;
  taxNumber?: string;
  productSalesPriceType?: string;
  mainAddressName?: string;
  mainAddressLine1?: string;
  mainAddressLine2?: string;
  mainAddressCity?: string;
  mainAddressRegion?: string;
  mainAddressPostalCode?: string;
  mainAddressCountry?: string;
  mainAddressCountryGroup?: string;
  deliveryAddressName?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryAddressCity?: string;
  deliveryAddressRegion?: string;
  deliveryAddressPostalCode?: string;
  deliveryAddressCountry?: string;
  deliveryAddressCountryGroup?: string;
  contactPersonName?: string;
  jobTitle?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  fax?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
  bankBic?: string;
  bankIban?: string;
};
