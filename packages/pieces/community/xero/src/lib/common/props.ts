import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

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
  invoice_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Invoice',
      description: 'Select an invoice',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/Invoices?summaryOnly=true&page=1',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const invoices: any[] = result.body?.Invoices ?? [];
          const options = invoices.slice(0, 50).map((inv) => {
            const labelParts = [inv.InvoiceNumber || inv.InvoiceID];
            if (inv.Contact?.Name) labelParts.push(inv.Contact.Name);
            if (inv.Status) labelParts.push(inv.Status);
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: inv.InvoiceID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load invoices',
        };
      },
    }),
  payable_invoice_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Invoice (Authorised)',
      description: 'Select an authorised invoice (sales or bill) to apply payment to.',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const url =
          'https://api.xero.com/api.xro/2.0/Invoices?summaryOnly=true&page=1&Statuses=AUTHORISED';

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const invoices: any[] = result.body?.Invoices ?? [];
          const options = invoices.slice(0, 50).map((inv) => {
            const labelParts = [
              inv.Type,
              inv.InvoiceNumber || inv.InvoiceID,
              inv.Contact?.Name,
              inv.AmountDue ? `Due ${inv.AmountDue}` : undefined,
            ];
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: inv.InvoiceID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load invoices',
        };
      },
    }),
  sales_invoice_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Sales Invoice (Sendable)',
      description: 'Select a sales invoice with a valid status for sending email (SUBMITTED, AUTHORISED, or PAID).',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const url =
          'https://api.xero.com/api.xro/2.0/Invoices?summaryOnly=true&page=1&Statuses=SUBMITTED,AUTHORISED,PAID&where=Type%3d%3d%22ACCREC%22';

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const invoices: any[] = result.body?.Invoices ?? [];
          const options = invoices.slice(0, 50).map((inv) => {
            const labelParts = [inv.InvoiceNumber || inv.InvoiceID];
            if (inv.Contact?.Name) labelParts.push(inv.Contact.Name);
            if (inv.Status) labelParts.push(inv.Status);
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: inv.InvoiceID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load sales invoices',
        };
      },
    }),
  editable_sales_invoice_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Sales Invoice (Editable)',
      description: 'Select a sales invoice (ACCREC) with DRAFT or SUBMITTED status.',
      required,
      refreshers: ['tenant_id', 'allow_authorised'],
      options: async ({ auth, propsValue, tenant_id, allow_authorised }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const allowAuthorised = Boolean(
          typeof allow_authorised !== 'undefined'
            ? allow_authorised
            : (propsValue as Record<string, unknown>)?.['allow_authorised']
        );
        const statuses = allowAuthorised
          ? 'DRAFT,SUBMITTED,AUTHORISED'
          : 'DRAFT,SUBMITTED';
        const url =
          `https://api.xero.com/api.xro/2.0/Invoices?summaryOnly=true&page=1&Statuses=${encodeURIComponent(statuses)}&where=Type%3d%3d%22ACCREC%22`;

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const invoices: any[] = result.body?.Invoices ?? [];
          const options = invoices.slice(0, 50).map((inv) => {
            const labelParts = [inv.InvoiceNumber || inv.InvoiceID];
            if (inv.Contact?.Name) labelParts.push(inv.Contact.Name);
            if (inv.Status) labelParts.push(inv.Status);
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: inv.InvoiceID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load sales invoices',
        };
      },
    }),
  credit_note_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Credit Note',
      description: 'Select a credit note to allocate from',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/CreditNotes',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const creditNotes: any[] = result.body?.CreditNotes ?? [];
          const options = creditNotes.slice(0, 50).map((cn) => {
            const labelParts = [cn.CreditNoteNumber || cn.CreditNoteID];
            if (cn.Contact?.Name) labelParts.push(cn.Contact.Name);
            if (cn.Type) labelParts.push(cn.Type);
            if (cn.Status) labelParts.push(cn.Status);
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: cn.CreditNoteID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load credit notes',
        };
      },
  }),
  contact_id: (required = false) =>
    Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to create invoice for.',
      required: required,
    }),
  contact_dropdown: (required = false) =>
    Property.Dropdown({
      displayName: 'Contact',
      description: 'Select a contact',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/Contacts?summaryOnly=true&page=1',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const contacts: any[] = result.body?.Contacts ?? [];
          const options = contacts.slice(0, 100).map((c) => {
            const labelParts = [c.Name];
            if (c.EmailAddress) labelParts.push(c.EmailAddress);
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: c.ContactID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load contacts',
        };
      },
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
  bank_account_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Bank Account',
      description: 'Select a bank account',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/Accounts',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const accounts: any[] = result.body?.Accounts ?? [];
          const options = accounts
            .filter(
              (acc) => acc?.Type === 'BANK' || acc?.EnablePaymentsToAccount === true
            )
            .slice(0, 100)
            .map((acc) => {
              const labelParts = [acc.Name || acc.Code || acc.AccountID];
              if (acc.Code) labelParts.push(acc.Code);
              return {
                label: labelParts.filter(Boolean).join(' • '),
                value: acc.AccountID,
              };
            });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load bank accounts',
        };
      },
    }),
  branding_theme_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Branding Theme',
      description: 'Select a branding theme',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/BrandingThemes',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const themes: any[] = result.body?.BrandingThemes ?? [];
          const options = themes.slice(0, 50).map((t) => ({
            label: t.Name || t.BrandingThemeID,
            value: t.BrandingThemeID,
          }));
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load branding themes',
        };
      },
    }),
  purchase_order_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Purchase Order',
      description: 'Select a purchase order to update',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/PurchaseOrders?page=1',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const pos: any[] = result.body?.PurchaseOrders ?? [];
          const options = pos.slice(0, 100).map((po) => {
            const labelParts = [
              po.PurchaseOrderNumber || po.PurchaseOrderID,
              po.Contact?.Name,
              po.Status,
            ];
            return {
              label: labelParts.filter(Boolean).join(' • '),
              value: po.PurchaseOrderID,
            };
          });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load purchase orders',
        };
      },
    }),
  account_code: (allowedTypes: string[], required = false) =>
    Property.Dropdown({
      displayName: 'Account',
      description: 'Select an account',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/Accounts',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const accounts: any[] = result.body?.Accounts ?? [];
          const options = accounts
            .filter((acc) =>
              Array.isArray(allowedTypes)
                ? allowedTypes.includes(acc?.Type)
                : true
            )
            .slice(0, 200)
            .map((acc) => {
              const labelParts = [acc.Name || acc.Code || acc.AccountID];
              if (acc.Code) labelParts.push(acc.Code);
              if (acc.Type) labelParts.push(acc.Type);
              return {
                label: labelParts.filter(Boolean).join(' • '),
                value: acc.AccountID,
              };
            });
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load accounts',
        };
      },
    }),
  project_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'Select a project',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/projects.xro/2.0/Projects?page=1',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const projects: any[] = result.body?.items ?? result.body?.Projects ?? [];
          const options = projects.slice(0, 200).map((p) => ({
            label: p.name || p.projectId,
            value: p.projectId,
          }));
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load projects',
        };
      },
    }),
  currency_code: (required = false) =>
    Property.Dropdown({
      displayName: 'Currency',
      description: 'Select a currency code',
      required,
      refreshers: ['tenant_id'],
      options: async ({ auth, propsValue, tenant_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };

        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.xero.com/api.xro/2.0/Currencies',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as OAuth2PropertyValue).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        const result = await httpClient.sendRequest<Record<string, any>>(request);
        if (result.status === 200) {
          const currencies: any[] = result.body?.Currencies ?? [];
          const options = currencies.slice(0, 300).map((c) => ({
            label: `${c.Code} • ${c.Description ?? ''}`.trim(),
            value: c.Code,
          }));
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load currencies',
        };
      },
    }),
};
