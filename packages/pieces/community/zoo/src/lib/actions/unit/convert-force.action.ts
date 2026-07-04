import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertForceAction = createAction({
  name: 'convert_force',
  displayName: 'Convert Force',
  description: 'Convert force measurements between different units',
  audience: 'both',
  aiMetadata: { description: 'Convert a single force value between newtons, kilonewtons, pound-force, and dynes. Use only for force; other quantities have their own dedicated convert actions. Read-only calculation that returns the same result for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The force value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Newtons', value: 'N' },
          { label: 'Kilonewtons', value: 'kN' },
          { label: 'Pound-force', value: 'lbf' },
          { label: 'Dynes', value: 'dyn' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Newtons', value: 'N' },
          { label: 'Kilonewtons', value: 'kN' },
          { label: 'Pound-force', value: 'lbf' },
          { label: 'Dynes', value: 'dyn' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/force/${propsValue.inputUnit}/${propsValue.outputUnit}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: {
        value: propsValue.value.toString(),
      },
    });
    return response.body;
  },
});
