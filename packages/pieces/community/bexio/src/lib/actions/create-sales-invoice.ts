import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import { bexioCommonProps } from '../common/props';

export const createSalesInvoiceAction = createAction({
  auth: bexioAuth,
  name: 'create_sales_invoice',
  displayName: 'Create Sales Invoice',
  description: 'Create a new product-based sales invoice',
  props: {
    document_nr: Property.ShortText({
      displayName: 'Document Number',
      description: 'Invoice number (required if automatic numbering is disabled)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Invoice title',
      required: false,
    }),
    contact_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact',
      description: 'The contact for this invoice',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }
        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    contact_sub_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact Sub',
      description: 'Contact sub-address (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    user_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'User',
      description: 'User assigned to this invoice',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const users = await client.get<Array<{ id: number; firstname: string | null; lastname: string | null; email: string }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => ({
              label: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
            options: [],
          };
        }
      },
    }),
    pr_project_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Project',
      description: 'Project associated with this invoice',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const projects = await client.get<Array<{
            id: number;
            name: string;
            nr?: string;
          }>>('/2.0/pr_project');

          return {
            disabled: false,
            options: projects.map((project) => ({
              label: project.nr ? `${project.name} (#${project.nr})` : project.name,
              value: project.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load projects',
            options: [],
          };
        }
      },
    }),
    language_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Language',
      description: 'Language for the invoice',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const languages = await client.get<Array<{ id: number; name: string }>>('/2.0/language');

          return {
            disabled: false,
            options: languages.map((lang) => ({
              label: lang.name,
              value: lang.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load languages',
            options: [],
          };
        }
      },
    }),
    bank_account_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Bank Account',
      description: 'Bank account for payment',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const bankAccounts = await client.get<Array<{
            id: number;
            name: string;
            iban_nr?: string;
            bank_account_nr?: string;
          }>>('/3.0/banking/accounts');

          return {
            disabled: false,
            options: bankAccounts.map((account) => {
              const iban = account.iban_nr || account.bank_account_nr;
              return {
                label: iban ? `${account.name} (${iban})` : account.name,
                value: account.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load bank accounts',
            options: [],
          };
        }
      },
    }),
    currency_id: bexioCommonProps.currency({
      displayName: 'Currency',
      required: true,
    }),
    payment_type_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Payment Type',
      description: 'Payment type for this invoice',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const paymentTypes = await client.get<Array<{ id: number; name: string }>>('/2.0/payment_type');

          return {
            disabled: false,
            options: paymentTypes.map((type) => ({
              label: type.name,
              value: type.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load payment types',
            options: [],
          };
        }
      },
    }),
    header: Property.LongText({
      displayName: 'Header',
      description: 'Header text for the invoice',
      required: false,
    }),
    footer: Property.LongText({
      displayName: 'Footer',
      description: 'Footer text for the invoice',
      required: false,
    }),
    mwst_type: Property.StaticDropdown({
      displayName: 'Tax Type',
      description: 'How taxes are handled',
      required: true,
      defaultValue: 0,
      options: {
        disabled: false,
        options: [
          { label: 'Including taxes', value: 0 },
          { label: 'Excluding taxes', value: 1 },
          { label: 'Exempt from taxes', value: 2 },
        ],
      },
    }),
    mwst_is_net: Property.Checkbox({
      displayName: 'Tax is Net',
      description: 'If taxes are included, set to true to add taxes to total, false to include in total',
      required: false,
      defaultValue: false,
    }),
    show_position_taxes: Property.Checkbox({
      displayName: 'Show Position Taxes',
      description: 'Show taxes for each position',
      required: false,
      defaultValue: false,
    }),
    is_valid_from: Property.ShortText({
      displayName: 'Valid From',
      description: 'Invoice valid from date (YYYY-MM-DD)',
      required: false,
    }),
    is_valid_to: Property.ShortText({
      displayName: 'Valid To',
      description: 'Invoice valid to date (YYYY-MM-DD)',
      required: false,
    }),
    contact_address_manual: Property.LongText({
      displayName: 'Manual Contact Address',
      description: 'Override contact address (leave empty to use contact address)',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Reference number',
      required: false,
    }),
    api_reference: Property.ShortText({
      displayName: 'API Reference',
      description: 'Reference for API use (can only be edited via API)',
      required: false,
    }),
    template_slug: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Document Template',
      description: 'Document template for the invoice',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const templates = await client.get<Array<{
            template_slug: string;
            name: string;
            is_default: boolean;
            default_for_document_types: string[];
          }>>('/3.0/document_templates');

          return {
            disabled: false,
            options: templates.map((template) => ({
              label: template.is_default ? `${template.name} (Default)` : template.name,
              value: template.template_slug,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load templates',
            options: [],
          };
        }
      },
    }),
    positionFields: Property.DynamicProperties({  
      auth: bexioAuth,
      displayName: 'Invoice Positions',
      description: 'Configure invoice line items',
      required: true,
      refreshers: ['auth'],
      props: async ({ auth }) => {
        let units: Array<{ id: number; name: string }> = [];
        let accounts: Array<{ id: number; account_no: string; name: string }> = [];
        let taxes: Array<{ id: number; name: string; percentage: string }> = [];

        if (auth) {
            try {
                const client = new BexioClient(auth);
              units = await client.get<Array<{ id: number; name: string }>>('/2.0/unit').catch(() => []);
              accounts = await client.get<Array<{ id: number; account_no: string; name: string }>>('/accounts').catch(() => []);
              const taxesResponse = await client.get<Array<{
                id: number;
                name: string;
                value: number;
                display_name?: string;
              }>>('/3.0/taxes?types=sales_tax&scope=active').catch(() => []);
              taxes = taxesResponse.map((tax) => ({
                id: tax.id,
                name: tax.display_name || tax.name,
                percentage: tax.value.toString(),
              }));
            } catch (error) {
              // Ignore error, use empty array as fallback
            }
        }

        const unitOptions = units.map((unit) => ({ label: unit.name, value: unit.id }));
        const accountOptions = accounts.map((acc) => ({ label: `${acc.account_no} - ${acc.name}`, value: acc.id }));
        const taxOptions = taxes.map((tax) => ({ label: `${tax.name} (${tax.percentage}%)`, value: tax.id }));

        return {
          positions: Property.Array({
            displayName: 'Positions',
            description: 'Invoice line items',
            required: true,
            properties: {
              type: Property.StaticDropdown({
                displayName: 'Position Type',
                description: 'Type of invoice position',
                required: true,
                defaultValue: 'KbPositionCustom',
                options: {
                  disabled: false,
                  options: [
                    { label: 'Custom Position', value: 'KbPositionCustom' },
                    { label: 'Article Position', value: 'KbPositionArticle' },
                    { label: 'Text Position', value: 'KbPositionText' },
                    { label: 'Subtotal Position', value: 'KbPositionSubtotal' },
                    { label: 'Page Break Position', value: 'KbPositionPagebreak' },
                    { label: 'Discount Position', value: 'KbPositionDiscount' },
                  ],
                },
              }),
              amount: Property.ShortText({
                displayName: 'Amount',
                description: 'Quantity/amount',
                required: true,
              }),
              unit_id: unitOptions.length > 0
                ? Property.StaticDropdown({
                    displayName: 'Unit',
                    description: 'Unit of measurement',
                    required: false,
                    options: {
                      disabled: false,
                      options: unitOptions,
                    },
                  })
                : Property.Number({
                    displayName: 'Unit ID',
                    description: 'Unit ID (use List Units action to find IDs)',
                    required: false,
                  }),
              account_id: accountOptions.length > 0
                ? Property.StaticDropdown({
                    displayName: 'Account',
                    description: 'Account for this position',
                    required: false,
                    options: {
                      disabled: false,
                      options: accountOptions,
                    },
                  })
                : Property.Number({
                    displayName: 'Account ID',
                    description: 'Account ID (use List Accounts action to find IDs)',
                    required: false,
                  }),
              tax_id: taxOptions.length > 0
                ? Property.StaticDropdown({
                    displayName: 'Tax',
                    description: 'Tax rate (only active sales taxes)',
                    required: false,
                    options: {
                      disabled: false,
                      options: taxOptions,
                    },
                  })
                : Property.Number({
                    displayName: 'Tax ID',
                    description: 'Tax ID (use List Taxes action to find IDs)',
                    required: false,
                  }),
              text: Property.LongText({
                displayName: 'Description',
                description: 'Position description/text',
                required: false,
              }),
              unit_price: Property.ShortText({
                displayName: 'Unit Price',
                description: 'Price per unit (max 6 decimals)',
                required: false,
              }),
              discount_in_percent: Property.ShortText({
                displayName: 'Discount (%)',
                description: 'Discount percentage (max 6 decimals)',
                required: false,
              }),
              parent_id: Property.Number({
                displayName: 'Parent ID',
                description: 'Parent position ID (for grouped positions)',
                required: false,
              }),
            },
          }),
        };
      },
    }),
  },
  async run(context) {
    const client = new BexioClient(context.auth);
    const props = context.propsValue;

    const requestBody: Record<string, unknown> = {};

    if (props['user_id']) {
      requestBody['user_id'] = props['user_id'];
    }
    if (props['language_id']) {
      requestBody['language_id'] = props['language_id'];
    }
    if (props['bank_account_id']) {
      requestBody['bank_account_id'] = props['bank_account_id'];
    }
    if (props['currency_id']) {
      requestBody['currency_id'] = props['currency_id'];
    }
    if (props['payment_type_id']) {
      requestBody['payment_type_id'] = props['payment_type_id'];
    }

    if (props['document_nr']) {
      requestBody['document_nr'] = props['document_nr'];
    }
    if (props['title'] !== undefined) {
      requestBody['title'] = props['title'] || null;
    }
    if (props['contact_id']) {
      requestBody['contact_id'] = props['contact_id'];
    }
    if (props['contact_sub_id']) {
      requestBody['contact_sub_id'] = props['contact_sub_id'];
    }
    if (props['pr_project_id']) {
      requestBody['pr_project_id'] = props['pr_project_id'];
    }
    if (props['header']) {
      requestBody['header'] = props['header'];
    }
    if (props['footer']) {
      requestBody['footer'] = props['footer'];
    }
    if (props['mwst_type'] !== undefined) {
      requestBody['mwst_type'] = props['mwst_type'];
    }
    if (props['mwst_is_net'] !== undefined) {
      requestBody['mwst_is_net'] = props['mwst_is_net'];
    }
    if (props['show_position_taxes'] !== undefined) {
      requestBody['show_position_taxes'] = props['show_position_taxes'];
    }
    if (props['is_valid_from']) {
      requestBody['is_valid_from'] = props['is_valid_from'];
    }
    if (props['is_valid_to']) {
      requestBody['is_valid_to'] = props['is_valid_to'];
    }
    if (props['contact_address_manual']) {
      requestBody['contact_address_manual'] = props['contact_address_manual'];
    }
    if (props['reference']) {
      requestBody['reference'] = props['reference'];
    }
    if (props['api_reference']) {
      requestBody['api_reference'] = props['api_reference'];
    }
    if (props['template_slug']) {
      requestBody['template_slug'] = props['template_slug'];
    }

    const positionFields = props['positionFields'] as Record<string, unknown>;
    if (positionFields && positionFields['positions'] && Array.isArray(positionFields['positions'])) {
      requestBody['positions'] = (positionFields['positions'] as Array<Record<string, unknown>>).map((position) => {
        const pos: Record<string, unknown> = {
          type: position['type'] || 'KbPositionCustom',
        };

        if (position['amount']) {
          pos['amount'] = position['amount'];
        }
        if (position['unit_id']) {
          pos['unit_id'] = position['unit_id'];
        }
        if (position['account_id']) {
          pos['account_id'] = position['account_id'];
        }
        if (position['tax_id']) {
          pos['tax_id'] = position['tax_id'];
        }
        if (position['text']) {
          pos['text'] = position['text'];
        }
        if (position['unit_price']) {
          pos['unit_price'] = position['unit_price'];
        }
        if (position['discount_in_percent']) {
          pos['discount_in_percent'] = position['discount_in_percent'];
        }
        if (position['parent_id']) {
          pos['parent_id'] = position['parent_id'];
        }

        return pos;
      });
    }

    const response = await client.post('/2.0/kb_invoice', requestBody);

    return response;
  },
});

