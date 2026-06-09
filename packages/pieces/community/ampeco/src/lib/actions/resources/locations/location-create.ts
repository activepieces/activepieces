import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters
} from '../../../common/utils';
import { LocationCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/locations/v2.0

export const locationCreateAction = createAction({
  auth: ampecoAuth,
  name: 'locationCreate',
  displayName: 'Resources - Locations - Create',
  description: 'Create a new location.',
  props: {
    name: Property.Array({
      displayName: 'Name',
      description: '',
      required: true,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    shortDescription: Property.Array({
      displayName: 'Short Description',
      description: '',
      required: false,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    description: Property.Array({
      displayName: 'Description',
      description: '',
      required: false,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    additionalDescription: Property.Array({
      displayName: 'Additional Description',
      description: '',
      required: false,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    geoposition__latitude: Property.Number({
      displayName: 'Geoposition - Latitude',
      description: '',
      required: true,
    }),

    geoposition__longitude: Property.Number({
      displayName: 'Geoposition - Longitude',
      description: '',
      required: true,
    }),

    address: Property.Array({
      displayName: 'Address',
      description: 'The full address of the location',
      required: true,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    streetAddress: Property.Array({
      displayName: 'Street Address',
      description: 'The street address of the location',
      required: false,
      properties: {
        locale: Property.ShortText({
          displayName: 'Locale',
          description: 'valid locale.',
          required: false,
        }),

        translation: Property.ShortText({
          displayName: 'Translation',
          description: '',
          required: false,
        }),
      },
    }),

    city: Property.ShortText({
      displayName: 'City',
      description: '',
      required: false,
    }),

    region: Property.ShortText({
      displayName: 'Region',
      description:
        'When country is not in US, AU, CA, UM or RO, you can provide the region',
      required: false,
    }),

    state: Property.Dropdown({
      displayName: 'State',
      required: false,
      auth: ampecoAuth,
      refreshers: ['country'],
      options: async ({ country }) => {
        if (!country) {
          return {
            options: [],
          };
        }

        type CountryKey = 'US' | 'AU' | 'CA' | 'UM' | 'RO';

        const stateMap = {
          US: [
            'AL',
            'AK',
            'AS',
            'AZ',
            'AR',
            'CA',
            'CO',
            'CT',
            'DE',
            'DC',
            'FM',
            'FL',
            'GA',
            'GU',
            'HI',
            'ID',
            'IL',
            'IN',
            'IA',
            'KS',
            'KY',
            'LA',
            'ME',
            'MH',
            'MD',
            'MA',
            'MI',
            'MN',
            'MS',
            'MO',
            'MT',
            'NE',
            'NV',
            'NH',
            'NJ',
            'NM',
            'NY',
            'NC',
            'ND',
            'MP',
            'OH',
            'OK',
            'OR',
            'PW',
            'PA',
            'PR',
            'RI',
            'SC',
            'SD',
            'TN',
            'TX',
            'UT',
            'VT',
            'VI',
            'VA',
            'WA',
            'WV',
            'WI',
            'WY',
          ],
          AU: [
            'NSW',
            'VIC',
            'QLD',
            'WA',
            'SA',
            'TAS',
            'ACT',
            'NT',
            'JBT',
            'CX',
            'NF',
            'CC',
            'AQ',
            'CSI',
            'ACI',
            'HM',
          ],
          CA: [
            'AB',
            'BC',
            'MB',
            'NB',
            'NL',
            'NT',
            'NS',
            'NU',
            'ON',
            'PE',
            'QC',
            'SK',
            'YT',
          ],
          UM: ['81', '84', '85', '67', '89', '71', '76', '95', '79'],
          RO: [
            'AB',
            'AR',
            'AG',
            'BC',
            'BH',
            'BN',
            'BT',
            'BV',
            'BR',
            'B',
            'BZ',
            'CL',
            'CS',
            'CT',
            'CV',
            'DB',
            'DJ',
            'GL',
            'GR',
            'GJ',
            'HR',
            'HD',
            'IL',
            'IS',
            'IF',
            'MM',
            'MH',
            'MS',
            'NT',
            'OT',
            'PH',
            'SM',
            'SJ',
            'SB',
            'SV',
            'TR',
            'TM',
            'TL',
            'VS',
            'VL',
            'VN',
          ],
        };

        const selectedCountry = country as unknown as string;
        if (selectedCountry in stateMap) {
          return {
            options: stateMap[selectedCountry as CountryKey].map((state) => ({
              label: state,
              value: state,
            })),
          };
        }

        return {
          options: [],
        };
      },
    }),

    country: Property.StaticDropdown({
      displayName: 'Country',
      description: '',
      required: true,
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
          { label: 'ZW', value: 'ZW' },
        ],
      },
    }),

    postCode: Property.ShortText({
      displayName: 'Post Code',
      description: '',
      required: false,
    }),

    workingHours__isAlwaysOpen: Property.StaticDropdown({
      displayName: 'Working Hours - Is Always Open',
      description:
        'Indicates that the location is always open for charging. If set to false, the `hours` field is required, otherwise it should be ignored.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    workingHours__stopSessionOutsideWorkingHours: Property.StaticDropdown({
      displayName: 'Working Hours - Stop Session Outside Working Hours',
      description:
        'If a User has initiated a charging session during Working hours but it is already outside of the Working hours, the session will be terminated by the system.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    workingHours__alwaysOpenForUserGroupIds: Property.Array({
      displayName: 'Working Hours - Always Open For User Group Ids',
      description: '',
      required: false,
    }),

    workingHours__hours__monday: Property.Array({
      displayName: 'Working Hours - Hours - Monday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__tuesday: Property.Array({
      displayName: 'Working Hours - Hours - Tuesday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__wednesday: Property.Array({
      displayName: 'Working Hours - Hours - Wednesday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__thursday: Property.Array({
      displayName: 'Working Hours - Hours - Thursday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__friday: Property.Array({
      displayName: 'Working Hours - Hours - Friday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__saturday: Property.Array({
      displayName: 'Working Hours - Hours - Saturday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    workingHours__hours__sunday: Property.Array({
      displayName: 'Working Hours - Hours - Sunday',
      description: 'Working hours interval for single day.',
      required: false,
      properties: {
        start: Property.ShortText({
          displayName: 'Start',
          description: '',
          required: true,
        }),

        end: Property.ShortText({
          displayName: 'End',
          description: '',
          required: true,
        }),
      },
    }),

    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'A valid timezone in the form of Area/Location, required when `Allow Multiple Time Zones` option is turned on in the Timezone Setting.',
      required: false,
    }),

    externalId: Property.ShortText({
      displayName: 'External Id',
      description: '',
      required: false,
    }),

    roamingOperatorId: Property.Number({
      displayName: 'Roaming Operator Id',
      description:
        'For roaming Locations, the ID of the roaming operator is provided.',
      required: false,
    }),

    tags: Property.Array({
      displayName: 'Tags',
      description: '',
      required: false,
    }),
  },
  async run(context): Promise<LocationCreateResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/locations/v2.0',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'name',
        'shortDescription',
        'description',
        'additionalDescription',
        'geoposition',
        'address',
        'streetAddress',
        'city',
        'region',
        'state',
        'country',
        'postCode',
        'workingHours',
        'timezone',
        'externalId',
        'roamingOperatorId',
        'tags',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as LocationCreateResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
