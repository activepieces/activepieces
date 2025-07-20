import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertAreaAction = createAction({
  name: 'convert_area',
  displayName: 'Convert Area',
  description: 'Convert area measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The area value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Square Meters', value: 'm2' },
          { label: 'Square Feet', value: 'ft2' },
          { label: 'Square Inches', value: 'in2' },
          { label: 'Square Yards', value: 'yd2' },
          { label: 'Square Kilometers', value: 'km2' },
          { label: 'Square Miles', value: 'mi2' },
          { label: 'Hectares', value: 'ha' },
          { label: 'Acres', value: 'ac' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Square Meters', value: 'm2' },
          { label: 'Square Feet', value: 'ft2' },
          { label: 'Square Inches', value: 'in2' },
          { label: 'Square Yards', value: 'yd2' },
          { label: 'Square Kilometers', value: 'km2' },
          { label: 'Square Miles', value: 'mi2' },
          { label: 'Hectares', value: 'ha' },
          { label: 'Acres', value: 'ac' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/area/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
