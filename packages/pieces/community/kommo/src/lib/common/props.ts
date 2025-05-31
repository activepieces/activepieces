import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './index';

interface KommoAuth {
  subdomain: string;
  apiToken: string;
}

export const pipelineDropdown = Property.Dropdown({
  displayName: 'Pipeline',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const pipelines = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads/pipelines');

    const options: DropdownOption<string>[] = (pipelines._embedded?.pipelines || []).map(
      (pipeline: any) => ({
        label: pipeline.name,
        value: pipeline.id.toString(),
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const statusDropdown = Property.Dropdown({
  displayName: 'Status',
  required: true,
  refreshers: ['pipelineId'],
  options: async ({ auth, pipelineId }) => {
    if (!auth || !pipelineId) {
      return {
        disabled: true,
        placeholder: 'Select a pipeline first',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const statuses = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/leads/pipelines/${pipelineId}/statuses`
    );

    const options: DropdownOption<string>[] = (statuses._embedded?.statuses || []).map(
      (status: any) => ({
        label: status.name,
        value: status.id.toString(),
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const userDropdown = Property.Dropdown({
  displayName: 'User',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const users = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/users');

    const options: DropdownOption<string>[] = (users._embedded?.users || []).map((user: any) => ({
      label: `${user.name} (${user.email})`,
      value: user.id.toString(),
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const lossReasonDropdown = Property.Dropdown({
  displayName: 'Loss Reason',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const reasons = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads/loss_reasons');

    const options: DropdownOption<string>[] = (reasons._embedded?.loss_reasons || []).map(
      (reason: any) => ({
        label: reason.name,
        value: reason.id.toString(),
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const leadDropdown = Property.Dropdown({
  displayName: 'Lead',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const leads = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads');

    const options: DropdownOption<string>[] = (leads._embedded?.leads || []).map((lead: any) => ({
      label: lead.name,
      value: lead.id.toString(),
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const companyDropdown = Property.Dropdown({
  displayName: 'Company',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const companies = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/companies');

    const options: DropdownOption<string>[] = (companies._embedded?.companies || []).map(
      (company: any) => ({
        label: company.name,
        value: company.id.toString(),
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const contactDropdown = Property.Dropdown({
  displayName: 'Contact',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth as KommoAuth;
    const contacts = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/contacts');

    const options: DropdownOption<string>[] = (contacts._embedded?.contacts || []).map(
      (contact: any) => ({
        label: `${contact.name} (${contact.custom_fields_values?.find((f: any) => f.field_code === 'EMAIL')?.values[0]?.value || 'no email'})`,
        value: contact.id.toString(),
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});
