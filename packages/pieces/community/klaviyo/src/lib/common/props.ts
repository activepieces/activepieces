import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { klaviyoAuth, KlaviyoAuthValue } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoProfile {
  id: string;
  attributes: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface KlaviyoList {
  id: string;
  attributes: {
    name?: string;
  };
}

export const profileIdDropdown = Property.Dropdown({
  displayName: 'Profile Id',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const profiles = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      '/profiles',
      {}
    );

    const options = (profiles.data as KlaviyoProfile[]).map((field) => {
      const firstName = field.attributes.first_name || '';
      const lastName = field.attributes.last_name || '';
      const label = [firstName, lastName].filter(Boolean).join(' ');
      return {
        label: label || field.attributes.email || field.id,
        value: field.id,
      };
    });

    return {
      disabled: false,
      options: options,
    };
  },
});

export const allProfileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Profile Ids',
  description: 'Select one or more Klaviyo profiles',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const profiles = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      '/profiles',
    );

    const options = (profiles.data as KlaviyoProfile[]).map((field) => {
      const firstName = field.attributes.first_name || '';
      const lastName = field.attributes.last_name || '';
      const email = field.attributes.email || '';
      const label =
        [firstName, lastName].filter(Boolean).join(' ') +
        (email ? ` (${email})` : '');
      return {
        label: label || field.id,
        value: field.id,
      };
    });

    return { options };
  },
});

export const profileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Profile Ids',
  description: 'Select one or more Klaviyo profiles',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth','list_id'],
  options: async ({ auth, list_id }) => {
    if (!auth || !list_id) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const profiles = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      `/lists/${list_id}/profiles`,
    );

    const options = (profiles.data as KlaviyoProfile[]).map((field) => {
      const firstName = field.attributes.first_name || '';
      const lastName = field.attributes.last_name || '';
      const email = field.attributes.email || '';
      const label =
        [firstName, lastName].filter(Boolean).join(' ') +
        (email ? ` (${email})` : '');
      return {
        label: label || field.id,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});

export const listIdDropdown = Property.Dropdown({
  displayName: 'List Id',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const list = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      '/lists',
      {}
    );

    const options = (list.data as KlaviyoList[]).map((field) => {
      return {
        label: field.attributes.name || field.id,
        value: field.id,
      };
    });

    return {
      disabled: false,
      options: options,
    };
  },
});

export const countryCode = Property.ShortText({
  displayName: 'Country Code',
  description:
    'Enter 2-letter ISO country code. Popular: US, GB, CA, DE, FR, AU, JP, CN, IN, BR',
  required: false,
});
