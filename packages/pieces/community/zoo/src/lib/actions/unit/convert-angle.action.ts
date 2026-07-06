import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertAngleAction = createAction({
  name: 'convert_angle',
  displayName: 'Convert Angle',
  description: 'Convert angle measurements between different units',
  audience: 'both',
  aiMetadata: { description: 'Convert a single angle value between degrees, radians, and gradians. Use only for angles; other quantities have their own dedicated convert actions. Read-only calculation that returns the same result for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The angle value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Degrees', value: 'deg' },
          { label: 'Radians', value: 'rad' },
          { label: 'Gradians', value: 'grad' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Degrees', value: 'deg' },
          { label: 'Radians', value: 'rad' },
          { label: 'Gradians', value: 'grad' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/angle/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
