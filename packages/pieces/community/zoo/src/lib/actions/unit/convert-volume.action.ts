import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertVolumeAction = createAction({
  name: 'convert_volume',
  displayName: 'Convert Volume',
  description: 'Convert volume measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The volume value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Cubic Meters', value: 'm3' },
          { label: 'Cubic Feet', value: 'ft3' },
          { label: 'Cubic Inches', value: 'in3' },
          { label: 'Liters', value: 'L' },
          { label: 'Gallons', value: 'gal' },
          { label: 'Milliliters', value: 'mL' },
          { label: 'Fluid Ounces', value: 'fl_oz' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Cubic Meters', value: 'm3' },
          { label: 'Cubic Feet', value: 'ft3' },
          { label: 'Cubic Inches', value: 'in3' },
          { label: 'Liters', value: 'L' },
          { label: 'Gallons', value: 'gal' },
          { label: 'Milliliters', value: 'mL' },
          { label: 'Fluid Ounces', value: 'fl_oz' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/volume/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
