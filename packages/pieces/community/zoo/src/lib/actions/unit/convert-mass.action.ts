import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertMassAction = createAction({
  name: 'convert_mass',
  displayName: 'Convert Mass',
  description: 'Convert mass measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The mass value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Kilograms', value: 'kg' },
          { label: 'Grams', value: 'g' },
          { label: 'Milligrams', value: 'mg' },
          { label: 'Pounds', value: 'lb' },
          { label: 'Ounces', value: 'oz' },
          { label: 'Metric Tons', value: 't' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Kilograms', value: 'kg' },
          { label: 'Grams', value: 'g' },
          { label: 'Milligrams', value: 'mg' },
          { label: 'Pounds', value: 'lb' },
          { label: 'Ounces', value: 'oz' },
          { label: 'Metric Tons', value: 't' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/mass/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
