import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertTorqueAction = createAction({
  name: 'convert_torque',
  displayName: 'Convert Torque',
  description: 'Convert torque measurements between different units',
  audience: 'both',
  aiMetadata: { description: 'Convert a single torque value between newton-meter, pound-foot, and kilogram-force-meter. Use only for torque; other quantities have their own dedicated convert actions. Read-only calculation that returns the same result for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The torque value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Newton Meter', value: 'Nm' },
          { label: 'Pound Foot', value: 'lbft' },
          { label: 'Kilogram Force Meter', value: 'kgfm' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Newton Meter', value: 'Nm' },
          { label: 'Pound Foot', value: 'lbft' },
          { label: 'Kilogram Force Meter', value: 'kgfm' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/torque/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
