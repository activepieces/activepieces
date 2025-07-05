import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';

export const countryDropdown = Property.StaticDropdown({
  displayName: 'Country',
  description: 'Recipient country code',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Australia', value: 'AU' },
      { label: 'United States', value: 'US' },
      { label: 'United Kingdom', value: 'GB' },
      { label: 'Canada', value: 'CA' },
      { label: 'Germany', value: 'DE' },
      { label: 'France', value: 'FR' },
      { label: 'Italy', value: 'IT' },
      { label: 'Spain', value: 'ES' },
      { label: 'Netherlands', value: 'NL' },
      { label: 'Belgium', value: 'BE' },
      { label: 'Switzerland', value: 'CH' },
      { label: 'Austria', value: 'AT' },
      { label: 'Sweden', value: 'SE' },
      { label: 'Norway', value: 'NO' },
      { label: 'Denmark', value: 'DK' },
      { label: 'Finland', value: 'FI' },
      { label: 'Poland', value: 'PL' },
      { label: 'Czech Republic', value: 'CZ' },
      { label: 'Hungary', value: 'HU' },
      { label: 'Slovakia', value: 'SK' },
      { label: 'Slovenia', value: 'SI' },
      { label: 'Croatia', value: 'HR' },
      { label: 'Bulgaria', value: 'BG' },
      { label: 'Romania', value: 'RO' },
      { label: 'Greece', value: 'GR' },
      { label: 'Portugal', value: 'PT' },
      { label: 'Ireland', value: 'IE' },
      { label: 'New Zealand', value: 'NZ' },
      { label: 'Japan', value: 'JP' },
      { label: 'South Korea', value: 'KR' },
      { label: 'Singapore', value: 'SG' },
      { label: 'Malaysia', value: 'MY' },
      { label: 'Thailand', value: 'TH' },
      { label: 'Philippines', value: 'PH' },
      { label: 'Indonesia', value: 'ID' },
      { label: 'India', value: 'IN' },
      { label: 'China', value: 'CN' },
      { label: 'Hong Kong', value: 'HK' },
      { label: 'Taiwan', value: 'TW' },
      { label: 'Brazil', value: 'BR' },
      { label: 'Argentina', value: 'AR' },
      { label: 'Chile', value: 'CL' },
      { label: 'Colombia', value: 'CO' },
      { label: 'Mexico', value: 'MX' },
      { label: 'Peru', value: 'PE' },
      { label: 'Venezuela', value: 'VE' },
      { label: 'Uruguay', value: 'UY' },
      { label: 'Paraguay', value: 'PY' },
      { label: 'Ecuador', value: 'EC' },
      { label: 'Bolivia', value: 'BO' },
      { label: 'South Africa', value: 'ZA' },
      { label: 'Egypt', value: 'EG' },
      { label: 'Morocco', value: 'MA' },
      { label: 'Tunisia', value: 'TN' },
      { label: 'Algeria', value: 'DZ' },
      { label: 'Nigeria', value: 'NG' },
      { label: 'Kenya', value: 'KE' },
      { label: 'Ghana', value: 'GH' },
      { label: 'Uganda', value: 'UG' },
      { label: 'Tanzania', value: 'TZ' },
      { label: 'Ethiopia', value: 'ET' },
      { label: 'Sudan', value: 'SD' },
      { label: 'Saudi Arabia', value: 'SA' },
      { label: 'United Arab Emirates', value: 'AE' },
      { label: 'Qatar', value: 'QA' },
      { label: 'Kuwait', value: 'KW' },
      { label: 'Bahrain', value: 'BH' },
      { label: 'Oman', value: 'OM' },
      { label: 'Jordan', value: 'JO' },
      { label: 'Lebanon', value: 'LB' },
      { label: 'Syria', value: 'SY' },
      { label: 'Iraq', value: 'IQ' },
      { label: 'Iran', value: 'IR' },
      { label: 'Turkey', value: 'TR' },
      { label: 'Israel', value: 'IL' },
      { label: 'Palestine', value: 'PS' },
      { label: 'Yemen', value: 'YE' },
      { label: 'Pakistan', value: 'PK' },
      { label: 'Afghanistan', value: 'AF' },
      { label: 'Bangladesh', value: 'BD' },
      { label: 'Sri Lanka', value: 'LK' },
      { label: 'Nepal', value: 'NP' },
      { label: 'Bhutan', value: 'BT' },
      { label: 'Maldives', value: 'MV' },
      { label: 'Mongolia', value: 'MN' },
      { label: 'Kazakhstan', value: 'KZ' },
      { label: 'Uzbekistan', value: 'UZ' },
      { label: 'Kyrgyzstan', value: 'KG' },
      { label: 'Tajikistan', value: 'TJ' },
      { label: 'Turkmenistan', value: 'TM' },
      { label: 'Azerbaijan', value: 'AZ' },
      { label: 'Georgia', value: 'GE' },
      { label: 'Armenia', value: 'AM' },
      { label: 'Ukraine', value: 'UA' },
      { label: 'Belarus', value: 'BY' },
      { label: 'Moldova', value: 'MD' },
      { label: 'Latvia', value: 'LV' },
      { label: 'Lithuania', value: 'LT' },
      { label: 'Estonia', value: 'EE' },
      { label: 'Iceland', value: 'IS' },
      { label: 'Luxembourg', value: 'LU' },
      { label: 'Monaco', value: 'MC' },
      { label: 'Liechtenstein', value: 'LI' },
      { label: 'San Marino', value: 'SM' },
      { label: 'Vatican City', value: 'VA' },
      { label: 'Andorra', value: 'AD' },
      { label: 'Malta', value: 'MT' },
      { label: 'Cyprus', value: 'CY' },
      { label: 'Albania', value: 'AL' },
      { label: 'North Macedonia', value: 'MK' },
      { label: 'Montenegro', value: 'ME' },
      { label: 'Bosnia and Herzegovina', value: 'BA' },
      { label: 'Serbia', value: 'RS' },
      { label: 'Kosovo', value: 'XK' },
    ],
  },
});

export const listIdDropdown = Property.Dropdown({ 
  displayName: 'List ID',
  description: 'Select the contact list to add the contact to',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }

    try {
      const { username, password } = auth as {
        username: string;
        password: string;
      };
      const apiKey = `${username}:${password}`;

      const response = await makeRequest(apiKey, HttpMethod.GET, '/lists', {});
      if (response.data && Array.isArray(response.data.data)) {
        return {
          disabled: false,
          options: response.data.data.map((list: any) => ({
            label: `${list.list_name} (ID: ${list.list_id})`,
            value: list.list_id.toString(),
          })),
        };
      }

      return {
        disabled: true,
        options: [],
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select the contact to update',
  required: true,
  refreshers: ['auth', 'list_id'],
  options: async ({ auth, list_id }) => {
    if (!auth || !list_id) {
      return {
        disabled: true,
        options: [],
      };
    }

    try {
      const { username, password } = auth as {
        username: string;
        password: string;
      };
      const apiKey = `${username}:${password}`;

      const response = await makeRequest(
        apiKey,
        HttpMethod.GET,
        `/lists/${list_id}/contacts`,
        {}
      );

      if (response.data && Array.isArray(response.data.data)) {
        return {
          disabled: false,
          options: response.data.data.map((contact: any) => ({
            label: `${contact.first_name || 'Unknown'} ${contact.last_name || ''} (${contact.phone_number || contact.email || 'No contact info'}) - ID: ${contact.contact_id}`,
            value: contact.contact_id.toString(),
          })),
        };
      }

      return {
        disabled: true,
        options: [],
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});
