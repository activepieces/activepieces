import { pipedriveAuth } from '../../index';
import {
  createAction,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  fetchOwnersOptions,
  retriveObjectCustomProperties,
} from '../common/props';

export const createProductAction = createAction({
  auth: pipedriveAuth,
  name: 'create-product',
  displayName: 'Create Product',
  description: 'Creates a new product',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    unit: Property.ShortText({
      displayName: 'Unit',
      required: false,
    }),
    tax: Property.Number({
      displayName: 'Tax percentage',
      required: false,
    }),
    isActive: Property.Checkbox({
      displayName: 'Is Active ?',
      required: false,
    }),
    ownerId: Property.Dropdown({
      displayName: 'Owner',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account.',
          };
        }
        const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
        const options = await fetchOwnersOptions(authValue);

        return {
          disabled: false,
          options,
        };
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: false,
      description: 'Please enter currency code.',
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    cost: Property.Number({
      displayName: 'Cost',
      required: false,
    }),
    overheadCost: Property.Number({
      displayName: 'Overhead Cost',
      required: false,
    }),
    visibleTo: Property.StaticDropdown({
      displayName: 'Visible To',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Item Owner',
            value: 1,
          },
          {
            label: 'All Users',
            value: 3,
          },
        ],
      },
    }),
    customfields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      refreshers: [],
      required: false,
      props: async ({ auth }) => {
        if (!auth) return {};

        const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
        return await retriveObjectCustomProperties(authValue, 'product');
      },
    }),
  },
  async run(context) {},
});
