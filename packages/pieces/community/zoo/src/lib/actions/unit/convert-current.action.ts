import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertCurrentAction = createAction({
  name: 'convert_current',
  displayName: 'Convert Current',
  description: 'Convert electrical current measurements between different units',
  audience: 'both',
  aiMetadata: { description: 'Convert a single electrical current value between amperes, milliamperes, and kiloamperes. Use only for electrical current; other quantities have their own dedicated convert actions. Read-only calculation that returns the same result for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The current value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Amperes', value: 'A' },
          { label: 'Milliamperes', value: 'mA' },
          { label: 'Kiloamperes', value: 'kA' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Amperes', value: 'A' },
          { label: 'Milliamperes', value: 'mA' },
          { label: 'Kiloamperes', value: 'kA' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/current/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
