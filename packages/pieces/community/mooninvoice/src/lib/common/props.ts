import { Property } from '@activepieces/pieces-framework';
import { getAccessToken, makeRequest } from './client';
import { mooninvoiceAuth } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyIdProp = Property.Dropdown({
  auth: mooninvoiceAuth,
  displayName: 'Company',
  description: 'Select the company',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (auth === undefined) {
      return {
        disabled: true,
        options: [],
      };
    }
    try {
      const accessToken = await getAccessToken(
        auth?.props.email as string,
        auth?.props.secret_text as string
      );
      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/company_list',
        { CompanySort: 'asc' }
      );
      return {
        disabled: false,
        options: response.data.map((company: any) => ({
          label: company.CompanyName,
          value: company.CompanyID,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});

export const contactIdProp = Property.Dropdown({
  auth: mooninvoiceAuth,
  displayName: 'Contact',
  description: 'Select the contact',
  required: true,
  refreshers: ['companyId'],
  options: async ({ auth, companyId }) => {
    if (auth === undefined || companyId === undefined) {
      return {
        disabled: true,
        options: [],
      };
    }
    try {
      const accessToken = await getAccessToken(
        auth?.props.email as string,
        auth?.props.secret_text as string
      );
      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/contact_list',
        { CompanyId: companyId, PageSize: 25, page: 1, ContactSort: 'asc' }
      );
      return {
        disabled: false,
        options: response.data.contacts.map((contact: any) => ({
          label: contact.FirstName + ' ' + contact.LastName,
          value: contact.ContactID,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});

export const projectIdProp = Property.Dropdown({
  auth: mooninvoiceAuth,
  displayName: 'Project',
  description: 'Select the project',
  required: true,
  refreshers: ['companyId'],
  options: async ({ auth, companyId }) => {
    if (auth === undefined || companyId === undefined) {
      return {
        disabled: true,
        options: [],
      };
    }
    try {
      const accessToken = await getAccessToken(
        auth?.props.email as string,
        auth?.props.secret_text as string
      );
      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/project_list',
        { CompanyID: companyId, PageSize: 25, page: 1, ProjectSort: 'asc' }
      );
      return {
        disabled: false,
        options: response.data.projects.map((project: any) => ({
          label: project.ProjectName,
          value: project.ProjectID,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});
