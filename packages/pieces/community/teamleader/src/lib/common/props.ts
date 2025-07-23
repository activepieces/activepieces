import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const emailTypeDropdown = Property.StaticDropdown({
  displayName: 'Email Type',
  description: 'Select the type of email address',
  required: true,
  options: {
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Invoicing', value: 'invoicing' },
      { label: 'Secondary', value: 'secondary' },
    ],
  },
});

export const genderDropdown = Property.StaticDropdown({
  displayName: 'Gender',
  description: 'Select the gender of the contact',
  required: false,
  options: {
    //female, male, non_binary, prefers_not_to_say, unknown
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'non_binary', value: 'non_binary' },
      { label: 'prefers_not_to_say', value: 'prefers_not_to_say' },
      { label: 'unknown', value: 'unknown' },
    ],
  },
});

export const countryDropdown = Property.StaticDropdown({
  displayName: 'Country',
  description: 'Select the country for the company',
  required: true,
  options: {
    options: [
      { label: 'Belgium', value: 'BE' },
      { label: 'Netherlands', value: 'NL' },
      { label: 'France', value: 'FR' },
      { label: 'Germany', value: 'DE' },
      { label: 'Luxembourg', value: 'LU' },
      { label: 'United Kingdom', value: 'GB' },
      { label: 'Spain', value: 'ES' },
      { label: 'Italy', value: 'IT' },
    ],
  },
});

export const currencyDropdown = Property.StaticDropdown({
  displayName: 'Currency',
  description: 'Select the currency',
  required: true,
  options: {
    options: [
      { label: 'Bosnia-Herzegovina Mark (BAM)', value: 'BAM' },
      { label: 'Canadian Dollar (CAD)', value: 'CAD' },
      { label: 'Swiss Franc (CHF)', value: 'CHF' },
      { label: 'Chilean Peso (CLP)', value: 'CLP' },
      { label: 'Chinese Yuan (CNY)', value: 'CNY' },
      { label: 'Colombian Peso (COP)', value: 'COP' },
      { label: 'Czech Koruna (CZK)', value: 'CZK' },
      { label: 'Danish Krone (DKK)', value: 'DKK' },
      { label: 'Euro (EUR)', value: 'EUR' },
      { label: 'British Pound (GBP)', value: 'GBP' },
      { label: 'Indian Rupee (INR)', value: 'INR' },
      { label: 'Icelandic Króna (ISK)', value: 'ISK' },
      { label: 'Japanese Yen (JPY)', value: 'JPY' },
      { label: 'Moroccan Dirham (MAD)', value: 'MAD' },
      { label: 'Mexican Peso (MXN)', value: 'MXN' },
      { label: 'Norwegian Krone (NOK)', value: 'NOK' },
      { label: 'Peruvian Sol (PEN)', value: 'PEN' },
      { label: 'Polish Złoty (PLN)', value: 'PLN' },
      { label: 'Romanian Leu (RON)', value: 'RON' },
      { label: 'Swedish Krona (SEK)', value: 'SEK' },
      { label: 'Turkish Lira (TRY)', value: 'TRY' },
      { label: 'US Dollar (USD)', value: 'USD' },
      { label: 'South African Rand (ZAR)', value: 'ZAR' },
    ],
  },
});

export const businessTypeIdDropdown = Property.Dropdown({
  displayName: 'Business type',
  description: 'Select the business type for the company',
  required: true,
  refreshers: ['country', 'auth'],
  options: async ({
    auth,
    country,
  }: {
    auth?: { access_token: string };
    country?: string;
  }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!country) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a country first',
      };
    }

    try {
      const businessTypes = await makeRequest(
        auth.access_token,
        HttpMethod.POST,
        '/businessTypes.list',
        { country: country }
      );
      return {
        disabled: false,
        options: businessTypes.data.map((businessType: any) => ({
          label: businessType.name,
          value: businessType.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select the contact ID',
  required: true,
  refreshers: ['company_id'],
  options: async ({
    auth,
    company_id,
  }: {
    auth?: { access_token: string };
    company_id?: string;
  }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const contacts = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/contacts.list',
        { company_id: company_id }
      );
      return {
        disabled: false,
        options: contacts.data.map((contact: any) => ({
          label: contact.first_name + ' ' + contact.last_name,
          value: contact.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading contacts',
      };
    }
  },
});

export const companiesIdDropdown = Property.Dropdown({
  displayName: 'Companies ID',
  description: 'Select the company ID',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const companies = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/companies.list'
      );
      return {
        disabled: false,
        options: companies.data.map((company: any) => ({
          label: company.name,
          value: company.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading contacts',
      };
    }
  },
});

export const dealIdDropdown = Property.Dropdown({
  displayName: 'Deal ID',
  description: 'Select the deal ID',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const deals = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/deals.list'
      );
      return {
        disabled: false,
        options: deals.data.map((deal: any) => ({
          label: deal.title,
          value: deal.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading deals',
      };
    }
  },
});

export const sourceIdDropdown = Property.Dropdown({
  displayName: 'Source ID',
  description: 'Select the source ID for the deal',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const sources = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/sources.list'
      );
      return {
        disabled: false,
        options: sources.data.map((source: any) => ({
          label: source.name,
          value: source.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading sources',
      };
    }
  },
});

export const departmentIdDropdown = Property.Dropdown({
  displayName: 'Department ID',
  description: 'Select the department ID for the deal',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const departments = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/departments.list'
      );
      return {
        disabled: false,
        options: departments.data.map((department: any) => ({
          label: department.name,
          value: department.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading departments',
      };
    }
  },
});

export const companiesLinkedContactsDropdown = Property.Dropdown({
  displayName: 'Linked Contacts',
  description: 'Select a linked contact',
  required: false,
  refreshers: ['auth', 'contact_id'],
  options: async ({
    auth,
    contact_id,
  }: {
    auth?: { access_token: string };
    contact_id?: string;
  }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!contact_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a contact first',
      };
    }
    try {
      const contactInfo = await makeRequest(
        auth.access_token as string,
        HttpMethod.POST,
        '/contacts.info',
        { id: contact_id }
      );
      if (!contactInfo.data || !contactInfo.data.companies) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No linked companies found for this contact',
        };
      }
      if (contactInfo.data.companies.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No linked companies found for this contact',
        };
      }
      return {
        disabled: false,
        options: contactInfo.data.companies.map((companyInfo: any) => ({
          label: `${companyInfo.company.name} (${companyInfo.position}${
            companyInfo.secondary_position
              ? ` / ${companyInfo.secondary_position}`
              : ''
          }${companyInfo.division ? ` - ${companyInfo.division}` : ''})`,
          value: companyInfo.company.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading contacts',
      };
    }
  },
});
