import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PartnerUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/partners/v2.0/{partner}

export const partnerUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerUpdate',
  displayName: 'Resources - Partners - Update',
  description: 'Update a partner.',
  props: {
        
  partner: Property.Number({
    displayName: 'Partner',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: 'Company name of the Partner.',
    required: false,
  }),

  regNo: Property.ShortText({
    displayName: 'Reg No',
    description: '',
    required: false,
  }),

  vatNo: Property.ShortText({
    displayName: 'Vat No',
    description: '',
    required: false,
  }),

  address: Property.ShortText({
    displayName: 'Address',
    description: '',
    required: false,
  }),

  postcode: Property.ShortText({
    displayName: 'Postcode',
    description: '',
    required: false,
  }),

  city: Property.ShortText({
    displayName: 'City',
    description: '',
    required: false,
  }),

  country: Property.StaticDropdown({
    displayName: 'Country',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'AF', value: 'AF' },
      { label: 'AX', value: 'AX' },
      { label: 'AL', value: 'AL' },
      { label: 'DZ', value: 'DZ' },
      { label: 'AS', value: 'AS' },
      { label: 'AD', value: 'AD' },
      { label: 'AO', value: 'AO' },
      { label: 'AI', value: 'AI' },
      { label: 'AQ', value: 'AQ' },
      { label: 'AG', value: 'AG' },
      { label: 'AR', value: 'AR' },
      { label: 'AM', value: 'AM' },
      { label: 'AW', value: 'AW' },
      { label: 'AU', value: 'AU' },
      { label: 'AT', value: 'AT' },
      { label: 'AZ', value: 'AZ' },
      { label: 'BS', value: 'BS' },
      { label: 'BH', value: 'BH' },
      { label: 'BD', value: 'BD' },
      { label: 'BB', value: 'BB' },
      { label: 'BY', value: 'BY' },
      { label: 'BE', value: 'BE' },
      { label: 'BZ', value: 'BZ' },
      { label: 'BJ', value: 'BJ' },
      { label: 'BM', value: 'BM' },
      { label: 'BT', value: 'BT' },
      { label: 'BO', value: 'BO' },
      { label: 'BQ', value: 'BQ' },
      { label: 'BA', value: 'BA' },
      { label: 'BW', value: 'BW' },
      { label: 'BV', value: 'BV' },
      { label: 'BR', value: 'BR' },
      { label: 'IO', value: 'IO' },
      { label: 'BN', value: 'BN' },
      { label: 'BG', value: 'BG' },
      { label: 'BF', value: 'BF' },
      { label: 'BI', value: 'BI' },
      { label: 'KH', value: 'KH' },
      { label: 'CM', value: 'CM' },
      { label: 'CA', value: 'CA' },
      { label: 'CV', value: 'CV' },
      { label: 'KY', value: 'KY' },
      { label: 'CF', value: 'CF' },
      { label: 'TD', value: 'TD' },
      { label: 'CL', value: 'CL' },
      { label: 'CN', value: 'CN' },
      { label: 'CX', value: 'CX' },
      { label: 'CC', value: 'CC' },
      { label: 'CO', value: 'CO' },
      { label: 'KM', value: 'KM' },
      { label: 'CG', value: 'CG' },
      { label: 'CD', value: 'CD' },
      { label: 'CK', value: 'CK' },
      { label: 'CR', value: 'CR' },
      { label: 'CI', value: 'CI' },
      { label: 'HR', value: 'HR' },
      { label: 'CU', value: 'CU' },
      { label: 'CW', value: 'CW' },
      { label: 'CY', value: 'CY' },
      { label: 'CZ', value: 'CZ' },
      { label: 'DK', value: 'DK' },
      { label: 'DJ', value: 'DJ' },
      { label: 'DM', value: 'DM' },
      { label: 'DO', value: 'DO' },
      { label: 'EC', value: 'EC' },
      { label: 'EG', value: 'EG' },
      { label: 'SV', value: 'SV' },
      { label: 'GQ', value: 'GQ' },
      { label: 'ER', value: 'ER' },
      { label: 'EE', value: 'EE' },
      { label: 'ET', value: 'ET' },
      { label: 'FK', value: 'FK' },
      { label: 'FO', value: 'FO' },
      { label: 'FJ', value: 'FJ' },
      { label: 'FI', value: 'FI' },
      { label: 'FR', value: 'FR' },
      { label: 'GF', value: 'GF' },
      { label: 'PF', value: 'PF' },
      { label: 'TF', value: 'TF' },
      { label: 'GA', value: 'GA' },
      { label: 'GM', value: 'GM' },
      { label: 'GE', value: 'GE' },
      { label: 'DE', value: 'DE' },
      { label: 'GH', value: 'GH' },
      { label: 'GI', value: 'GI' },
      { label: 'GR', value: 'GR' },
      { label: 'GL', value: 'GL' },
      { label: 'GD', value: 'GD' },
      { label: 'GP', value: 'GP' },
      { label: 'GU', value: 'GU' },
      { label: 'GT', value: 'GT' },
      { label: 'GG', value: 'GG' },
      { label: 'GN', value: 'GN' },
      { label: 'GW', value: 'GW' },
      { label: 'GY', value: 'GY' },
      { label: 'HT', value: 'HT' },
      { label: 'HM', value: 'HM' },
      { label: 'VA', value: 'VA' },
      { label: 'HN', value: 'HN' },
      { label: 'HK', value: 'HK' },
      { label: 'HU', value: 'HU' },
      { label: 'IS', value: 'IS' },
      { label: 'IN', value: 'IN' },
      { label: 'ID', value: 'ID' },
      { label: 'IR', value: 'IR' },
      { label: 'IQ', value: 'IQ' },
      { label: 'IE', value: 'IE' },
      { label: 'IM', value: 'IM' },
      { label: 'IL', value: 'IL' },
      { label: 'IT', value: 'IT' },
      { label: 'JM', value: 'JM' },
      { label: 'JP', value: 'JP' },
      { label: 'JE', value: 'JE' },
      { label: 'JO', value: 'JO' },
      { label: 'KZ', value: 'KZ' },
      { label: 'KE', value: 'KE' },
      { label: 'KI', value: 'KI' },
      { label: 'KP', value: 'KP' },
      { label: 'KR', value: 'KR' },
      { label: 'XK', value: 'XK' },
      { label: 'KW', value: 'KW' },
      { label: 'KG', value: 'KG' },
      { label: 'LA', value: 'LA' },
      { label: 'LV', value: 'LV' },
      { label: 'LB', value: 'LB' },
      { label: 'LS', value: 'LS' },
      { label: 'LR', value: 'LR' },
      { label: 'LY', value: 'LY' },
      { label: 'LI', value: 'LI' },
      { label: 'LT', value: 'LT' },
      { label: 'LU', value: 'LU' },
      { label: 'MO', value: 'MO' },
      { label: 'MK', value: 'MK' },
      { label: 'MG', value: 'MG' },
      { label: 'MW', value: 'MW' },
      { label: 'MY', value: 'MY' },
      { label: 'MV', value: 'MV' },
      { label: 'ML', value: 'ML' },
      { label: 'MT', value: 'MT' },
      { label: 'MH', value: 'MH' },
      { label: 'MQ', value: 'MQ' },
      { label: 'MR', value: 'MR' },
      { label: 'MU', value: 'MU' },
      { label: 'YT', value: 'YT' },
      { label: 'MX', value: 'MX' },
      { label: 'FM', value: 'FM' },
      { label: 'MD', value: 'MD' },
      { label: 'MC', value: 'MC' },
      { label: 'MN', value: 'MN' },
      { label: 'ME', value: 'ME' },
      { label: 'MS', value: 'MS' },
      { label: 'MA', value: 'MA' },
      { label: 'MZ', value: 'MZ' },
      { label: 'MM', value: 'MM' },
      { label: 'NA', value: 'NA' },
      { label: 'NR', value: 'NR' },
      { label: 'NP', value: 'NP' },
      { label: 'NL', value: 'NL' },
      { label: 'NC', value: 'NC' },
      { label: 'NZ', value: 'NZ' },
      { label: 'NI', value: 'NI' },
      { label: 'NE', value: 'NE' },
      { label: 'NG', value: 'NG' },
      { label: 'NU', value: 'NU' },
      { label: 'NF', value: 'NF' },
      { label: 'MP', value: 'MP' },
      { label: 'NO', value: 'NO' },
      { label: 'OM', value: 'OM' },
      { label: 'PK', value: 'PK' },
      { label: 'PW', value: 'PW' },
      { label: 'PS', value: 'PS' },
      { label: 'PA', value: 'PA' },
      { label: 'PG', value: 'PG' },
      { label: 'PY', value: 'PY' },
      { label: 'PE', value: 'PE' },
      { label: 'PH', value: 'PH' },
      { label: 'PN', value: 'PN' },
      { label: 'PL', value: 'PL' },
      { label: 'PT', value: 'PT' },
      { label: 'PR', value: 'PR' },
      { label: 'QA', value: 'QA' },
      { label: 'RE', value: 'RE' },
      { label: 'RO', value: 'RO' },
      { label: 'RU', value: 'RU' },
      { label: 'RW', value: 'RW' },
      { label: 'BL', value: 'BL' },
      { label: 'SH', value: 'SH' },
      { label: 'KN', value: 'KN' },
      { label: 'LC', value: 'LC' },
      { label: 'MF', value: 'MF' },
      { label: 'PM', value: 'PM' },
      { label: 'VC', value: 'VC' },
      { label: 'WS', value: 'WS' },
      { label: 'SM', value: 'SM' },
      { label: 'ST', value: 'ST' },
      { label: 'SA', value: 'SA' },
      { label: 'SN', value: 'SN' },
      { label: 'RS', value: 'RS' },
      { label: 'SC', value: 'SC' },
      { label: 'SL', value: 'SL' },
      { label: 'SG', value: 'SG' },
      { label: 'SX', value: 'SX' },
      { label: 'SK', value: 'SK' },
      { label: 'SI', value: 'SI' },
      { label: 'SB', value: 'SB' },
      { label: 'SO', value: 'SO' },
      { label: 'ZA', value: 'ZA' },
      { label: 'GS', value: 'GS' },
      { label: 'SS', value: 'SS' },
      { label: 'ES', value: 'ES' },
      { label: 'LK', value: 'LK' },
      { label: 'SD', value: 'SD' },
      { label: 'SR', value: 'SR' },
      { label: 'SJ', value: 'SJ' },
      { label: 'SZ', value: 'SZ' },
      { label: 'SE', value: 'SE' },
      { label: 'CH', value: 'CH' },
      { label: 'SY', value: 'SY' },
      { label: 'TW', value: 'TW' },
      { label: 'TJ', value: 'TJ' },
      { label: 'TZ', value: 'TZ' },
      { label: 'TH', value: 'TH' },
      { label: 'TL', value: 'TL' },
      { label: 'TG', value: 'TG' },
      { label: 'TK', value: 'TK' },
      { label: 'TO', value: 'TO' },
      { label: 'TT', value: 'TT' },
      { label: 'TN', value: 'TN' },
      { label: 'TR', value: 'TR' },
      { label: 'TM', value: 'TM' },
      { label: 'TC', value: 'TC' },
      { label: 'TV', value: 'TV' },
      { label: 'UG', value: 'UG' },
      { label: 'UA', value: 'UA' },
      { label: 'AE', value: 'AE' },
      { label: 'GB', value: 'GB' },
      { label: 'US', value: 'US' },
      { label: 'UM', value: 'UM' },
      { label: 'UY', value: 'UY' },
      { label: 'UZ', value: 'UZ' },
      { label: 'VU', value: 'VU' },
      { label: 'VE', value: 'VE' },
      { label: 'VN', value: 'VN' },
      { label: 'VG', value: 'VG' },
      { label: 'VI', value: 'VI' },
      { label: 'WF', value: 'WF' },
      { label: 'EH', value: 'EH' },
      { label: 'YE', value: 'YE' },
      { label: 'ZM', value: 'ZM' },
      { label: 'ZW', value: 'ZW' }
      ],
    },
  }),

  region: Property.ShortText({
    displayName: 'Region',
    description: 'When country is not in US, AU, CA, UM or RO, you can provide the region.',
    required: false,
  }),

  state: Property.Dropdown({
        displayName: 'State',
        auth:ampecoAuth,
        required: false,
        refreshers: ['country'],
        options: async ({ country }) => {
          if (!country) {
            return {
              options: [],
            };
          }
          
          type CountryKey = 'US' | 'AU' | 'CA' | 'UM' | 'RO';
          
          const stateMap = {
            'US': ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'], 
'AU': ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'JBT', 'CX', 'NF', 'CC', 'AQ', 'CSI', 'ACI', 'HM'], 
'CA': ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'], 
'UM': ['81', '84', '85', '67', '89', '71', '76', '95', '79'], 
'RO': ['AB', 'AR', 'AG', 'BC', 'BH', 'BN', 'BT', 'BV', 'BR', 'B', 'BZ', 'CL', 'CS', 'CT', 'CV', 'DB', 'DJ', 'GL', 'GR', 'GJ', 'HR', 'HD', 'IL', 'IS', 'IF', 'MM', 'MH', 'MS', 'NT', 'OT', 'PH', 'SM', 'SJ', 'SB', 'SV', 'TR', 'TM', 'TL', 'VS', 'VL', 'VN']
          };
          
          const selectedCountry = country as unknown as string;
          if (selectedCountry in stateMap) {
            return {
              options: stateMap[selectedCountry as CountryKey].map(state => ({
                label: state,
                value: state,
              })),
            };
          }
          
          return {
            options: [],
          };
        }
      }),
    

  contactDetails__administrative__contactPerson: Property.ShortText({
    displayName: 'Contact Details - Administrative - Contact Person',
    description: '',
    required: false,
  }),

  contactDetails__administrative__email: Property.ShortText({
    displayName: 'Contact Details - Administrative - Email',
    description: '',
    required: false,
  }),

  contactDetails__administrative__phone: Property.ShortText({
    displayName: 'Contact Details - Administrative - Phone',
    description: '',
    required: false,
  }),

  contactDetails__technical__contactPerson: Property.ShortText({
    displayName: 'Contact Details - Technical - Contact Person',
    description: '',
    required: false,
  }),

  contactDetails__technical__email: Property.ShortText({
    displayName: 'Contact Details - Technical - Email',
    description: '',
    required: false,
  }),

  contactDetails__technical__phone: Property.ShortText({
    displayName: 'Contact Details - Technical - Phone',
    description: '',
    required: false,
  }),

  contactDetails__billing__contactPerson: Property.ShortText({
    displayName: 'Contact Details - Billing - Contact Person',
    description: '',
    required: false,
  }),

  contactDetails__billing__email: Property.ShortText({
    displayName: 'Contact Details - Billing - Email',
    description: '',
    required: false,
  }),

  contactDetails__billing__phone: Property.ShortText({
    displayName: 'Contact Details - Billing - Phone',
    description: '',
    required: false,
  }),

  notifications__technical__chargePointFaults: Property.StaticDropdown({
    displayName: 'Notifications - Technical - Charge Point Faults',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  notifications__billing__settlementReports: Property.StaticDropdown({
    displayName: 'Notifications - Billing - Settlement Reports',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  monthlyPlatformFee: Property.Number({
    displayName: 'Monthly Platform Fee',
    description: '',
    required: false,
  }),

  options__createUsers: Property.StaticDropdown({
    displayName: 'Options - Create Users',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__addUserBalance: Property.StaticDropdown({
    displayName: 'Options - Add User Balance',
    description: 'When set to false the API tokens related to this partner would not receive the users\' balance in the response.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__supplierOnReceipts: Property.StaticDropdown({
    displayName: 'Options - Supplier On Receipts',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__allowToControlTariffs: Property.StaticDropdown({
    displayName: 'Options - Allow To Control Tariffs',
    description: 'Allows the Partner to update the tariff pricing.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__allowToControlTariffGroups: Property.StaticDropdown({
    displayName: 'Options - Allow To Control Tariff Groups',
    description: 'In addition to `allowToControlTariffs`, the Partner would also be able to manage Tariff Groups - attach and remove Tariffs, change Tariffs order in the Tariff Group.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  corporateBilling__enabled: Property.StaticDropdown({
    displayName: 'Corporate Billing - Enabled',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  corporateBilling__monthlyLimit: Property.Number({
    displayName: 'Corporate Billing - Monthly Limit',
    description: '',
    required: false,
  }),

  corporateBilling__discount: Property.Number({
    displayName: 'Corporate Billing - Discount',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: 'Third party identifier of the partner.',
    required: false,
  }),

  bankDetails__bankIban: Property.ShortText({
    displayName: 'Bank Details - Bank Iban',
    description: 'IBAN that is provided for the partner.',
    required: false,
  }),

  bankDetails__bankName: Property.ShortText({
    displayName: 'Bank Details - Bank Name',
    description: 'Name of the Bank for which the partner has provided IBAN.',
    required: false,
  }),

  bankDetails__bankAddress: Property.ShortText({
    displayName: 'Bank Details - Bank Address',
    description: 'Address of the partner\'s Bank.',
    required: false,
  }),

  bankDetails__bankCode: Property.ShortText({
    displayName: 'Bank Details - Bank Code',
    description: 'Bank code assigned by a central bank, a bank supervisory body or a Bankers Association in the country.',
    required: false,
  }),

  bankDetails__bankAccountNumber: Property.ShortText({
    displayName: 'Bank Details - Bank Account Number',
    description: 'Bank account ID provided by the partner.',
    required: false,
  }),

  bankDetails__bankAccountType: Property.ShortText({
    displayName: 'Bank Details - Bank Account Type',
    description: 'Type of account the Partner has provided.',
    required: false,
  }),
  },
  async run(context): Promise<PartnerUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partners/v2.0/{partner}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'regNo', 'vatNo', 'address', 'postcode', 'city', 'country', 'region', 'state', 'contactDetails', 'notifications', 'monthlyPlatformFee', 'options', 'corporateBilling', 'externalId', 'bankDetails']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as PartnerUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
