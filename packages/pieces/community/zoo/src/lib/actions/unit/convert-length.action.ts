import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertLengthAction = createAction({
  name: 'convert_length',
  displayName: 'Convert Length',
  description: 'Convert length measurements between different units',
  audience: 'both',
  aiMetadata: { description: 'Convert a single length value between units such as meters, kilometers, centimeters, millimeters, inches, feet, yards, and miles. Use only for length/distance; other quantities have their own dedicated convert actions. Read-only calculation that returns the same result for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Unit Conversion',
  props: {
    value: Property.Number({
      displayName: 'Value',
      required: true,
      description: 'The length value to convert',
    }),
    inputUnit: Property.StaticDropdown({
      displayName: 'Input Unit',
      required: true,
      options: {
        options: [
          { label: 'Meters', value: 'm' },
          { label: 'Kilometers', value: 'km' },
          { label: 'Centimeters', value: 'cm' },
          { label: 'Millimeters', value: 'mm' },
          { label: 'Inches', value: 'in' },
          { label: 'Feet', value: 'ft' },
          { label: 'Yards', value: 'yd' },
          { label: 'Miles', value: 'mi' },
        ],
      },
    }),
    outputUnit: Property.StaticDropdown({
      displayName: 'Output Unit',
      required: true,
      options: {
        options: [
          { label: 'Meters', value: 'm' },
          { label: 'Kilometers', value: 'km' },
          { label: 'Centimeters', value: 'cm' },
          { label: 'Millimeters', value: 'mm' },
          { label: 'Inches', value: 'in' },
          { label: 'Feet', value: 'ft' },
          { label: 'Yards', value: 'yd' },
          { label: 'Miles', value: 'mi' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/unit/conversion/length/${propsValue.inputUnit}/${propsValue.outputUnit}`,
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
