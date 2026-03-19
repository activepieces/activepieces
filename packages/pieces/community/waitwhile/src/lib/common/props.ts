import { Property } from '@activepieces/pieces-framework';
import { waitwhileAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const visitIdDropdown = Property.Dropdown({
  auth: waitwhileAuth,
  displayName: 'Visit ID',
  description: 'Select a Visit ID',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    const api_key = auth.secret_text;
    const response = (await makeRequest(
      api_key,
      HttpMethod.GET,
      '/visits'
    )) as any;
    return {
      disabled: false,
      options: response.results.map((visit: any) => ({
        label: `${visit.name} - ${visit.notes}`,
        value: visit.id,
      })),
    };
  },
});

export const customerIdDropdown = Property.Dropdown({
  auth: waitwhileAuth,
  displayName: 'Customer ID',
  description: 'Select a Customer ID',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    const api_key = auth.secret_text;
    const response = (await makeRequest(
      api_key,
      HttpMethod.GET,
      '/customers'
    )) as any;
    return {
      disabled: false,
      options: response.results.map((customer: any) => {
        return {
          label: customer.name,
          value: customer.id,
        };
      }),
    };
  },
});

export const locationIdDropdown = Property.Dropdown({
  auth: waitwhileAuth,
  displayName: 'Location',
  description: 'Select a Location',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    const api_key = auth.secret_text;
    const response = (await makeRequest(
      api_key,
      HttpMethod.GET,
      '/locations'
    )) as any;
    return {
      disabled: false,
      options: response.results.map((location: any) => ({
        label: location.name,
        value: location.id,
      })),
    };
  },
});
