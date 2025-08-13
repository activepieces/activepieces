import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const props = {
  tenant_id: Property.Dropdown({
    displayName: 'Organization',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth)
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.xero.com/connections',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (auth as OAuth2PropertyValue).access_token,
        },
      };

      const result = await httpClient.sendRequest<
        {
          id: string;
          authEventId: string;
          tenantId: string;
          tenantType: string;
          tenantName: string;
          createdDateUtc: string;
          updatedDateUtc: string;
        }[]
      >(request);

      if (result.status === 200) {
        return {
          disabled: false,
          options: [
            {
              label: result.body?.[0].tenantName,
              value: result.body?.[0].tenantId,
            },
          ],
        };
      }

      return {
        disabled: true,
        options: [],
        placeholder: 'Error processing tenant_id',
      };
    },
  }),
  invoice_id: Property.ShortText({
    displayName: 'Invoice ID',
    description: 'ID of the invoice to update',
    required: false,
  }),
  contact_id: (required = false) =>
    Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to create invoice for.',
      required: required,
    }),
  contact_name: (required = false) =>
    Property.ShortText({
      displayName: 'Contact Name',
      description: 'Contact name, in full.',
      required: required,
    }),
  contact_email: (required = false) =>
    Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact.',
      required: required,
    }),
};

export const creditNoteIdDropdown = Property.Dropdown({
  displayName: 'Credit Note',
  refreshers: ['auth', 'tenant_id'],
  required: true,
  options: async ({ auth, tenant_id }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    if (!tenant_id) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Please select a tenant',
      };
    }
    try {
      const result = await makeRequest(
        (auth as OAuth2PropertyValue).access_token,
        HttpMethod.GET,
        '/CreditNotes',
        null,
        {
          'Xero-Tenant-Id': String(tenant_id),
        }
      );

      console.log('Credit Notes API Response:', result);

      if (!result.CreditNotes || result.CreditNotes.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No credit notes found',
        };
      }

      return {
        disabled: false,
        options: result.CreditNotes.map((creditNote: any) => ({
          label: `${creditNote.CreditNoteNumber} - ${
            creditNote.Contact?.Name || 'Unknown Contact'
          } (${creditNote.CurrencyCode} ${creditNote.RemainingCredit?.toFixed(
            2
          )} remaining)`,
          value: creditNote.CreditNoteID,
        })),
      };
    } catch (e) {
      console.error('Error fetching credit notes:', e);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error processing credit notes',
      };
    }
  },
});

export const invoiceIdDropdown = Property.Dropdown({
  displayName: 'Invoice',
  refreshers: ['auth', 'tenant_id'],
  required: true,
  options: async ({ auth, tenant_id }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    if (!tenant_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a tenant',
      };
    }
    try {
      const result = await makeRequest(
        (auth as OAuth2PropertyValue).access_token,
        HttpMethod.GET,
        '/Invoices',
        null,
        {
          'Xero-Tenant-Id': String(tenant_id),
        }
      );
      console.log(result);
      if (!result.Invoices || result.Invoices.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No invoices found',
        };
      }
      return {
        disabled: false,
        options: result.Invoices.map((invoice: any) => ({
          label: `${invoice.InvoiceNumber} - ${
            invoice.Contact?.Name || 'Unknown Contact'
          } (${invoice.CurrencyCode} ${invoice.RemainingCredit?.toFixed(
            2
          )} remaining)`,
          value: invoice.InvoiceID,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error processing invoices',
      };
    }
  },
});
