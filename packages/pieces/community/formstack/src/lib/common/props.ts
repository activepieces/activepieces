import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Forms ',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    const forms = await makeRequest(
      accessToken,
      HttpMethod.GET,
      '/form.json',
      {}
    );
    const options = forms.forms.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});

export const submissionIdDropdown = Property.Dropdown({
  displayName: 'Submissions ',
  required: true,
  refreshers: ['auth', 'form_id'],
  options: async ({ auth, form_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    if (!form_id) {
      return {
        disabled: true,
        placeholder: 'Please select a form first',
        options: [],
      };
    }
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    const forms = await makeRequest(
      accessToken,
      HttpMethod.GET,
      `/form/${form_id}/.json`,
      {}
    );
    const options = forms.forms.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});
