import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertPressureAction = createAction({
  name: 'convert_pressure',
  displayName: 'Convert Pressure',
  description: 'Convert pressure measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The pressure value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Pascal', value: 'Pa' },
          { label: 'Kilopascal', value: 'kPa' },
          { label: 'Bar', value: 'bar' },
          { label: 'Atmosphere', value: 'atm' },
          { label: 'Pounds per Square Inch', value: 'psi' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Pascal', value: 'Pa' },
          { label: 'Kilopascal', value: 'kPa' },
          { label: 'Bar', value: 'bar' },
          { label: 'Atmosphere', value: 'atm' },
          { label: 'Pounds per Square Inch', value: 'psi' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/pressure/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
