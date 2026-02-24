import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './index';
import { kommoAuth } from '../..';

interface KommoAuth {
  subdomain: string;
  apiToken: string;
}

export const pipelineDropdown = (required = false) => Property.Dropdown({
  auth: kommoAuth,
  displayName: 'Pipeline',
  required,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth.props;
    const pipelines = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads/pipelines');

    const options: DropdownOption<number>[] = (pipelines._embedded?.pipelines || []).map(
      (pipeline: any) => ({
        label: pipeline.name,
        value: pipeline.id
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const statusDropdown = (required = false) => Property.Dropdown({
  auth: kommoAuth,
  displayName: 'Status',
  required,
  refreshers: ['pipelineId'],
  options: async ({ auth, pipelineId }) => {
    if (!auth || !pipelineId) {
      return {
        disabled: true,
        placeholder: 'Select a pipeline first',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth.props;
    const statuses = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/leads/pipelines/${pipelineId}/statuses`
    );

    const options: DropdownOption<number>[] = (statuses._embedded?.statuses || []).map(
      (status: any) => ({
        label: status.name,
        value: status.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const userDropdown = (required = false) => Property.Dropdown({
  auth: kommoAuth,
  displayName: 'Unique identified of a responsible user',
  required,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth.props;
    const users = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/users');

    const options: DropdownOption<number>[] = (users._embedded?.users || []).map((user: any) => ({
      label: `${user.name} (${user.email})`,
      value: user.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const lossReasonDropdown = (required = false) => Property.Dropdown({
  auth: kommoAuth,
  displayName: 'Loss Reason',
  required,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Kommo account',
        options: [],
      };
    }

    const { subdomain, apiToken } = auth.props;
    const reasons = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads/loss_reasons');

    const options: DropdownOption<number>[] = (reasons._embedded?.loss_reasons || []).map(
      (reason: any) => ({
        label: reason.name,
        value: reason.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const leadDropdown = Property.Dropdown({
  auth: kommoAuth,
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

    const { subdomain, apiToken } = auth.props;
    const leads = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads');

    const options: DropdownOption<number>[] = (leads._embedded?.leads || []).map((lead: any) => ({
      label: lead.name,
      value: lead.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const companyDropdown = Property.Dropdown({
  auth: kommoAuth,
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

    const { subdomain, apiToken } = auth.props;
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
  auth: kommoAuth,
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

    const { subdomain, apiToken } = auth.props;
    const contacts = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/contacts');

    const options: DropdownOption<number>[] = (contacts._embedded?.contacts || []).map(
      (contact: any) => ({
        label: contact.name,
        value: contact.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});
