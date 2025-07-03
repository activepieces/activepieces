import { businessCentralAuth } from '../..';
import {
  DropdownOption,
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { ACTION_ENTITY_DROPDOWN_OPTIONS } from './constants';
import { customersEntityProps } from './props/customers.entity';
import { bankAccountsEntityProps } from './props/bankAccounts.entity';
import { contactsEntityProps } from './props/contacts.entity';
import {
  currenciesEntityNumberProps,
  currenciesEntityProps,
} from './props/currencies.entity';
import { disputeStatusEntityProps } from './props/disputeStatus.entity';
import { employeesEntityProps } from './props/employees.entity';
import { vendorsEntityProps } from './props/vendors.entity';
import { journalsEntityProps } from './props/journals.entity';
import { locationsEntityProps } from './props/locations.entity';
import { paymentMethodsEntityProps } from './props/paymentMethods.entity';
import {
  paymentTermsEntityNumberProps,
  paymentTermsEntityProps,
} from './props/paymentTerms.entity';
import { projectsEntityProps } from './props/projects.entity';
import { itemCategoriesEntityProps } from './props/itemCategories.entity';
import { itemsEntityNumberProps, itemsEntityProps } from './props/items.entity';
import { itemVariantsEntityProps } from './props/itemVariants.entity';
import {
  salesOrderLinesEntityNumberProps,
  salesOrdersLinesEntityProps,
} from './props/salesOrderLines.entity';
import {
  salesInvoiceLinesEntityNumberProps,
  salesInvoiceLinesEntityProps,
} from './props/salesInvoiceLines.entity';
import {
  salesQuoteLinesEntityNumberProps,
  salesQuoteLinesEntityProps,
} from './props/salesQuoteLines.entity';
import { shipmentMethodsEntityProps } from './props/shipmentMethods.entity';
import { EntityProp } from './types';
import { salesInvoicesEntityProps } from './props/salesInvoices.entity';
import { salesOrdersEntityProps } from './props/salesOrders.entity';
import { salesQuotesEntityProps } from './props/salesQuotes.entity';

export const commonProps = {
  company_id: Property.Dropdown({
    displayName: 'Company',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect account first',
        };
      }

      const authValue = auth as PiecePropValueSchema<
        typeof businessCentralAuth
      >;
      const client = makeClient(authValue);

      const res = await client.listCompanies();
      const options: DropdownOption<string>[] = [];

      for (const company of res.value) {
        options.push({ label: company.name, value: company.id });
      }

      return {
        disabled: false,
        options,
      };
    },
  }),
  record_id: Property.ShortText({
    displayName: 'Record ID',
    required: true,
  }),
  record_type: Property.StaticDropdown({
    displayName: 'Record Type',
    required: true,
    options: {
      disabled: false,
      options: ACTION_ENTITY_DROPDOWN_OPTIONS,
    },
  }),
  record_fields: Property.DynamicProperties({
    displayName: 'Record Fields',
    refreshers: ['company_id', 'record_type'],
    required: true,
    props: async ({ auth, company_id, record_type }) => {
      if (!auth) return {};
      if (!company_id) return {};
      if (!record_type) return {};

      const recordType = record_type as unknown as string;
      const companyId = company_id as unknown as string;
      const authValue = auth as PiecePropValueSchema<
        typeof businessCentralAuth
      >;
      const client = makeClient(authValue);

      const fields: DynamicPropsValue = {};

      // fetch entity prop schema
      const entitySchema = getEntityPropSchema(recordType);

      for (const prop of entitySchema) {
        switch (prop.type) {
          case 'text':
            fields[prop.name] = Property.ShortText({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'multi_text':
            fields[prop.name] = Property.LongText({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'date':
            fields[prop.name] = Property.DateTime({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'number':
            fields[prop.name] = Property.Number({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'boolean':
            fields[prop.name] = Property.Checkbox({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'static_select':
            fields[prop.name] = Property.StaticDropdown({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
              options: {
                disabled: false,
                options: prop.options ?? [],
              },
            });
            break;
          case 'static_multi_select':
            fields[prop.name] = Property.StaticMultiSelectDropdown({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
              options: {
                disabled: false,
                options: prop.options ?? [],
              },
            });
            break;
          case 'dynamic_multi_select':
          case 'dynamic_select':
            {
              const propType =
                prop.type === 'dynamic_select'
                  ? Property.StaticDropdown
                  : Property.StaticMultiSelectDropdown;

              const response = await client.filterRecords(
                companyId,
                prop.options.sourceFieldSlug,
                {
                  $select: `${prop.options.labelField},id`,
                }
              );
              const options: DropdownOption<string>[] = [];

              for (const option of response.value) {
                options.push({
                  label: option[prop.options.labelField] as string,
                  value: option['id'] as string,
                });
              }
              fields[prop.name] = propType({
                displayName: prop.displayName,
                description: prop.description,
                required: prop.isRequired,
                options: {
                  disabled: false,
                  options,
                },
              });
            }
            break;
          default:
            break;
        }
      }
      return fields;
    },
  }),
  record_filter_fields: Property.DynamicProperties({
    displayName: 'Filter Fields',
    refreshers: ['company_id', 'record_type'],
    required: true,
    props: async ({ auth, company_id, record_type }) => {
      if (!auth) return {};
      if (!company_id) return {};
      if (!record_type) return {};

      const recordType = record_type as unknown as string;

      const fields: DynamicPropsValue = {};

      // fetch entity prop schema
      const entitySchema = getEntityPropSchema(recordType);

      // currently only support text fields
      for (const prop of entitySchema) {
        switch (prop.type) {
          case 'text':
            fields[prop.name] = Property.ShortText({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          case 'multi_text':
            fields[prop.name] = Property.LongText({
              displayName: prop.displayName,
              description: prop.description,
              required: prop.isRequired,
            });
            break;
          default:
            break;
        }
      }
      return fields;
    },
  }),
};

export function formatRecordFields(
  recordFields: DynamicPropsValue,
  recordType: string
) {
  const numberFields = [];
  switch (recordType) {
    case 'currencies':
      numberFields.push(...currenciesEntityNumberProps);
      break;
    case 'items':
      numberFields.push(...itemsEntityNumberProps);
      break;
    case 'salesInvoiceLines':
      numberFields.push(...salesInvoiceLinesEntityNumberProps);
      break;
    case 'salesOrders':
      numberFields.push(...salesOrderLinesEntityNumberProps);
      break;
    case 'salesOrderLines':
      numberFields.push(...salesOrderLinesEntityNumberProps);
      break;
    case 'salesQuoteLines':
      numberFields.push(...salesQuoteLinesEntityNumberProps);
      break;
    case 'paymentTerms':
      numberFields.push(...paymentTermsEntityNumberProps);
      break;
    default:
      break;
  }

  const formattedRecordFields: DynamicPropsValue = {};

  for (const key in recordFields) {
    if (recordFields[key] !== undefined) {
      if (numberFields.includes(key)) {
        formattedRecordFields[key] = Number(recordFields[key]);
      } else {
        formattedRecordFields[key] = recordFields[key];
      }
    }
  }

  return formattedRecordFields;
}

export function getEntityPropSchema(recordType: string): EntityProp[] {
  let entitySchema: EntityProp[] = [];

  // fetch entity prop schema
  switch (recordType) {
    case 'bankAccounts':
      entitySchema = bankAccountsEntityProps;
      break;
    case 'contacts':
      entitySchema = contactsEntityProps;
      break;
    case 'currencies':
      entitySchema = currenciesEntityProps;
      break;
    case 'customers':
      entitySchema = customersEntityProps;
      break;
    case 'disputeStatus':
      entitySchema = disputeStatusEntityProps;
      break;
    case 'employees':
      entitySchema = employeesEntityProps;
      break;
    case 'itemCategories':
      entitySchema = itemCategoriesEntityProps;
      break;
    case 'items':
      entitySchema = itemsEntityProps;
      break;
    case 'itemVariants':
      entitySchema = itemVariantsEntityProps;
      break;
    case 'journals':
      entitySchema = journalsEntityProps;
      break;
    case 'locations':
      entitySchema = locationsEntityProps;
      break;
    case 'paymentTerms':
      entitySchema = paymentTermsEntityProps;
      break;
    case 'paymentMethods':
      entitySchema = paymentMethodsEntityProps;
      break;
    case 'projects':
      entitySchema = projectsEntityProps;
      break;
    case 'salesInvoiceLines':
      entitySchema = salesInvoiceLinesEntityProps;
      break;
    case 'salesInvoices':
      entitySchema = salesInvoicesEntityProps;
      break;
    case 'salesOrderLines':
      entitySchema = salesOrdersLinesEntityProps;
      break;
    case 'salesOrders':
      entitySchema = salesOrdersEntityProps;
      break;
    case 'salesQuoteLines':
      entitySchema = salesQuoteLinesEntityProps;
      break;
    case 'salesQuotes':
      entitySchema = salesQuotesEntityProps;
      break;
    case 'shipmentMethods':
      entitySchema = shipmentMethodsEntityProps;
      break;
    case 'vendors':
      entitySchema = vendorsEntityProps;
      break;
    default:
      break;
  }
  return entitySchema;
}
