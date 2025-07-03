import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertEnergyAction = createAction({
  name: 'convert_energy',
  displayName: 'Convert Energy',
  description: 'Convert energy measurements between different units',
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The energy value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Joules', value: 'J' },
          { label: 'Kilojoules', value: 'kJ' },
          { label: 'Calories', value: 'cal' },
          { label: 'Kilocalories', value: 'kcal' },
          { label: 'Watt Hours', value: 'Wh' },
          { label: 'Kilowatt Hours', value: 'kWh' },
          { label: 'British Thermal Units', value: 'BTU' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Joules', value: 'J' },
          { label: 'Kilojoules', value: 'kJ' },
          { label: 'Calories', value: 'cal' },
          { label: 'Kilocalories', value: 'kcal' },
          { label: 'Watt Hours', value: 'Wh' },
          { label: 'Kilowatt Hours', value: 'kWh' },
          { label: 'British Thermal Units', value: 'BTU' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/energy/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
