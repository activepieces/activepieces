import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertFrequencyAction = createAction({
  name: 'convert_frequency',
  displayName: 'Convert Frequency',
  description: 'Convert frequency measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The frequency value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Hertz', value: 'Hz' },
          { label: 'Kilohertz', value: 'kHz' },
          { label: 'Megahertz', value: 'MHz' },
          { label: 'Gigahertz', value: 'GHz' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Hertz', value: 'Hz' },
          { label: 'Kilohertz', value: 'kHz' },
          { label: 'Megahertz', value: 'MHz' },
          { label: 'Gigahertz', value: 'GHz' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/frequency/${propsValue.inputUnit}/${propsValue.outputUnit}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: {
        value: propsValue.value.toString(),
      },
    });
    return response.body;
  },
});
