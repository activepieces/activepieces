import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import { bexioCommonProps } from '../common/props';

export const updateProductAction = createAction({
  auth: bexioAuth,
  name: 'update_product',
  displayName: 'Update Product',
  description: 'Update an existing product or service',
  props: {
    article_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Product',
      description: 'Select the product to update',
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
          const articles = await client.get<Array<{
            id: number;
            intern_code?: string;
            intern_name: string;
            article_type_id?: number;
          }>>('/2.0/article');

          return {
            disabled: false,
            options: articles.map((article) => {
              const label = article.intern_code
                ? `${article.intern_name} (${article.intern_code})`
                : article.intern_name;
              return {
                label,
                value: article.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load products',
            options: [],
          };
        }
      },
    }),
    user_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'User',
      description: 'User associated with this product',
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
          const users = await client.get<Array<{
            id: number;
            firstname?: string | null;
            lastname?: string | null;
            email: string;
          }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => {
              const name = user.firstname && user.lastname
                ? `${user.firstname} ${user.lastname}`
                : user.email;
              return {
                label: name,
                value: user.id,
              };
            }),
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
    intern_code: Property.ShortText({
      displayName: 'Internal Code',
      description: 'Internal product code',
      required: false,
    }),
    intern_name: Property.ShortText({
      displayName: 'Internal Name',
      description: 'Internal product name',
      required: false,
    }),
    intern_description: Property.LongText({
      displayName: 'Internal Description',
      description: 'Internal product description',
      required: false,
    }),
    contact_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact',
      description: 'Contact associated with this product',
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
    deliverer_code: Property.ShortText({
      displayName: 'Supplier Code',
      description: 'Supplier product code',
      required: false,
    }),
    deliverer_name: Property.ShortText({
      displayName: 'Supplier Name',
      description: 'Supplier product name',
      required: false,
    }),
    deliverer_description: Property.LongText({
      displayName: 'Supplier Description',
      description: 'Supplier product description',
      required: false,
    }),
    purchase_price: Property.ShortText({
      displayName: 'Purchase Price',
      description: 'Purchase price',
      required: false,
    }),
    sale_price: Property.ShortText({
      displayName: 'Sale Price',
      description: 'Sale price',
      required: false,
    }),
    purchase_total: Property.Number({
      displayName: 'Purchase Total',
      description: 'Total purchase amount',
      required: false,
    }),
    sale_total: Property.Number({
      displayName: 'Sale Total',
      description: 'Total sale amount',
      required: false,
    }),
    currency_id: bexioCommonProps.currency({
      displayName: 'Currency',
      required: false,
    }),
    tax_income_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Income Tax',
      description: 'Tax for income/sales',
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
          const taxes = await client.get<Array<{
            id: number;
            name: string;
            value: number;
            display_name?: string;
            type?: string;
          }>>('/3.0/taxes');

          return {
            disabled: false,
            options: taxes
              .filter((tax) => tax.type === 'sales_tax' || !tax.type)
              .map((tax) => ({
                label: tax.display_name || tax.name,
                value: tax.id,
              })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load taxes',
            options: [],
          };
        }
      },
    }),
    tax_expense_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Expense Tax',
      description: 'Tax for expenses/purchases',
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
          const taxes = await client.get<Array<{
            id: number;
            name: string;
            value: number;
            display_name?: string;
            type?: string;
          }>>('/3.0/taxes');

          return {
            disabled: false,
            options: taxes
              .filter((tax) => tax.type === 'pre_tax' || !tax.type)
              .map((tax) => ({
                label: tax.display_name || tax.name,
                value: tax.id,
              })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load taxes',
            options: [],
          };
        }
      },
    }),
    unit_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Unit',
      description: 'Unit of measurement',
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
          const units = await client.get<Array<{ id: number; name: string }>>('/2.0/unit');

          return {
            disabled: false,
            options: units.map((unit) => ({
              label: unit.name,
              value: unit.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load units',
            options: [],
          };
        }
      },
    }),
    is_stock: Property.Checkbox({
      displayName: 'Is Stock Item',
      description: 'Whether this is a stock item (requires stock_edit scope)',
      required: false,
    }),
    stock_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Stock Location',
      description: 'Stock location',
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
          const stocks = await client.get<Array<{ id: number; name: string }>>('/2.0/stock').catch(() => []);

          return {
            disabled: false,
            options: stocks.map((stock) => ({
              label: stock.name,
              value: stock.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load stock locations',
            options: [],
          };
        }
      },
    }),
    stock_place_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Stock Area',
      description: 'Stock area/place',
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
          const stockPlaces = await client.get<Array<{ id: number; name: string }>>('/2.0/stock_place').catch(() => []);

          return {
            disabled: false,
            options: stockPlaces.map((place) => ({
              label: place.name,
              value: place.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load stock areas',
            options: [],
          };
        }
      },
    }),
    stock_nr: Property.Number({
      displayName: 'Stock Number',
      description: 'Current stock quantity (can only be set if no bookings exist)',
      required: false,
    }),
    stock_min_nr: Property.Number({
      displayName: 'Minimum Stock',
      description: 'Minimum stock quantity',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Product width',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Product height',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Product weight',
      required: false,
    }),
    volume: Property.Number({
      displayName: 'Volume',
      description: 'Product volume',
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Remarks',
      description: 'Additional remarks',
      required: false,
    }),
    delivery_price: Property.Number({
      displayName: 'Delivery Price',
      description: 'Delivery price',
      required: false,
    }),
    article_group_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Article Group',
      description: 'Product group/category',
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
          const groups = await client.get<Array<{ id: number; name: string }>>('/2.0/article_group').catch(() => []);

          return {
            disabled: false,
            options: groups.map((group) => ({
              label: group.name,
              value: group.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load article groups',
            options: [],
          };
        }
      },
    }),
    account_id: bexioCommonProps.account({
      displayName: 'Account',
      description: 'Account for this product',
      required: false,
    }),
    expense_account_id: bexioCommonProps.account({
      displayName: 'Expense Account',
      description: 'Expense account for this product',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const props = propsValue;
    const articleId = props['article_id'] as number;

    const requestBody: Record<string, unknown> = {};

    if (props['user_id']) {
      requestBody['user_id'] = props['user_id'];
    }
    if (props['intern_code']) {
      requestBody['intern_code'] = props['intern_code'];
    }
    if (props['intern_name']) {
      requestBody['intern_name'] = props['intern_name'];
    }
    if (props['intern_description']) {
      requestBody['intern_description'] = props['intern_description'];
    }
    if (props['contact_id']) {
      requestBody['contact_id'] = props['contact_id'];
    }
    if (props['deliverer_code']) {
      requestBody['deliverer_code'] = props['deliverer_code'];
    }
    if (props['deliverer_name']) {
      requestBody['deliverer_name'] = props['deliverer_name'];
    }
    if (props['deliverer_description']) {
      requestBody['deliverer_description'] = props['deliverer_description'];
    }
    if (props['purchase_price']) {
      requestBody['purchase_price'] = props['purchase_price'];
    }
    if (props['sale_price']) {
      requestBody['sale_price'] = props['sale_price'];
    }
    if (props['purchase_total']) {
      requestBody['purchase_total'] = props['purchase_total'];
    }
    if (props['sale_total']) {
      requestBody['sale_total'] = props['sale_total'];
    }
    if (props['currency_id']) {
      requestBody['currency_id'] = props['currency_id'];
    }
    if (props['tax_income_id']) {
      requestBody['tax_income_id'] = props['tax_income_id'];
    }
    if (props['tax_expense_id']) {
      requestBody['tax_expense_id'] = props['tax_expense_id'];
    }
    if (props['unit_id']) {
      requestBody['unit_id'] = props['unit_id'];
    }
    if (props['is_stock'] !== undefined) {
      requestBody['is_stock'] = props['is_stock'];
    }
    if (props['stock_id']) {
      requestBody['stock_id'] = props['stock_id'];
    }
    if (props['stock_place_id']) {
      requestBody['stock_place_id'] = props['stock_place_id'];
    }
    if (props['stock_nr'] !== undefined) {
      requestBody['stock_nr'] = props['stock_nr'];
    }
    if (props['stock_min_nr'] !== undefined) {
      requestBody['stock_min_nr'] = props['stock_min_nr'];
    }
    if (props['width']) {
      requestBody['width'] = props['width'];
    }
    if (props['height']) {
      requestBody['height'] = props['height'];
    }
    if (props['weight']) {
      requestBody['weight'] = props['weight'];
    }
    if (props['volume']) {
      requestBody['volume'] = props['volume'];
    }
    if (props['remarks']) {
      requestBody['remarks'] = props['remarks'];
    }
    if (props['delivery_price']) {
      requestBody['delivery_price'] = props['delivery_price'];
    }
    if (props['article_group_id']) {
      requestBody['article_group_id'] = props['article_group_id'];
    }
    if (props['account_id']) {
      requestBody['account_id'] = props['account_id'];
    }
    if (props['expense_account_id']) {
      requestBody['expense_account_id'] = props['expense_account_id'];
    }

    const response = await client.post<{
      id: number;
      intern_code: string;
      intern_name: string;
    }>(`/2.0/article/${articleId}`, requestBody);

    return response;
  },
});

