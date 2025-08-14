import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import {
  VTigerAuthValue,
  queryRecords,
  countRecords,
  elementTypeProperty,
  generateElementFields,
  instanceLogin,
} from '../common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const searchRecords = createAction({
  name: 'search_records',
  auth: vtigerAuth,
  displayName: 'Search Records',
  description: 'Search for a record.',
  props: {
    elementType: elementTypeProperty,
    fields: Property.DynamicProperties({
      displayName: 'Search Fields',
      description: 'Enter your filter criteria',
      required: true,
      refreshers: ['elementType'],
      props: async ({ auth, elementType }) => {
        if (!auth || !elementType) {
          return {};
        }

        const instance = await instanceLogin(
          (auth as PiecePropValueSchema<typeof vtigerAuth>).instance_url,
          (auth as PiecePropValueSchema<typeof vtigerAuth>).username,
          (auth as PiecePropValueSchema<typeof vtigerAuth>).password
        );

        if (instance === null) {
          return {};
        }

        return generateElementFields(
          auth as VTigerAuthValue,
          elementType as unknown as string,
          {},
          true
        );
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Enter the maximum number of records to return.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const vtigerInstance = await instanceLogin(
      auth.instance_url,
      auth.username,
      auth.password
    );
    if (vtigerInstance === null) return;

    const count = await countRecords(auth, propsValue.elementType as string);
    if (count > 0) {
      const records: Record<string, unknown>[] = await queryRecords(
        auth,
        propsValue.elementType as string,
        0,
        count
      );

      const filtered = records.filter((record) => {
        return Object.entries(propsValue['fields']).every(([key, value]) => {
          const recordValue = record[key];
          if (typeof value === 'string') {
            const rv = typeof recordValue === 'string' ? recordValue : String(recordValue ?? '');
            return rv.toLowerCase().includes(value.toLowerCase());
          }
          return recordValue === value;
        });
      });

      return propsValue.limit ? filtered.slice(0, propsValue.limit) : filtered;
    } else {
      return [];
    }
  },
});
