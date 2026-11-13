import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import { genderApiCommon } from '../common/client';

function countryOfOriginOutputSchema(): OutputSchema {
  return {
    fields: [
      { key: 'first_name', label: 'First Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'probability', label: 'Gender Probability', format: 'number' },
      { key: 'result_found', label: 'Result Found', format: 'boolean' },
      {
        key: 'country_of_origin',
        label: 'Countries of Origin',
        labelKey: 'country_name',
        listItems: [
          { key: 'country', label: 'Country Code' },
          { key: 'country_name', label: 'Country Name' },
          { key: 'probability', label: 'Probability', format: 'number' },
          { key: 'continental_region', label: 'Continental Region' },
          { key: 'statistical_region', label: 'Statistical Region' },
        ],
      },
      { key: 'language_of_origin', label: 'Language of Origin' },
      { key: 'meaning', label: 'Meaning' },
      { key: 'country_of_origin_map_url', label: 'Map URL', format: 'url' },
      { key: 'credits_used', label: 'Credits Used', format: 'number' },
    ],
  };
}

const INPUT_TYPES: string[] = ['first_name', 'full_name', 'email'];

export const getCountryOfOrigin = createAction({
  auth: genderApiAuth,
  name: 'getCountryOfOrigin',
  classification: 'READ',
  displayName: 'Get Country of Origin',
  description:
    'Find the likely countries of origin of a name, from a first name, full name or email address',
  audience: 'both',
  aiMetadata: {
    description:
      'Estimates the most likely countries of origin (up to 25, with probabilities), the language of origin and the meaning of a name via the Gender API. Choose the input type (first_name, full_name or email) and pass the value. Costs 2 credits per call. Read-only lookup that is safe to repeat.',
    idempotent: true,
  },
  props: {
    input_type: Property.StaticDropdown<string>({
      displayName: 'Input Type',
      description: 'What kind of value you are providing',
      required: true,
      defaultValue: 'first_name',
      options: {
        disabled: false,
        options: [
          { label: 'First Name', value: 'first_name' },
          { label: 'Full Name', value: 'full_name' },
          { label: 'Email', value: 'email' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The first name, full name or email address to look up',
      required: true,
    }),
  },
  outputSchema: countryOfOriginOutputSchema(),
  async run({ auth, propsValue }) {
    const inputType = INPUT_TYPES.find((type) => type === propsValue.input_type);
    if (!inputType) {
      throw new Error(
        `Unsupported input type "${propsValue.input_type}". Use first_name, full_name or email.`
      );
    }
    const response = await genderApiCommon.request<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/country-of-origin',
      body: { [inputType]: propsValue.value },
    });
    const data = genderApiCommon.toRecord(response);
    const details = genderApiCommon.toRecord(data['details']);
    const origins = Array.isArray(data['country_of_origin'])
      ? data['country_of_origin']
      : [];
    return {
      first_name: genderApiCommon.toText(data['first_name']),
      gender: genderApiCommon.toText(data['gender']),
      probability: genderApiCommon.toNumber(data['probability']),
      result_found: data['result_found'] === true,
      country_of_origin: origins.map((item) => {
        const origin = genderApiCommon.toRecord(item);
        return {
          country: genderApiCommon.toText(origin['country']),
          country_name: genderApiCommon.toText(origin['country_name']),
          probability: genderApiCommon.toNumber(origin['probability']),
          continental_region: genderApiCommon.toText(origin['continental_region']),
          statistical_region: genderApiCommon.toText(origin['statistical_region']),
        };
      }),
      language_of_origin: genderApiCommon.toText(data['language_of_origin']),
      meaning: genderApiCommon.toText(data['meaning']),
      country_of_origin_map_url: genderApiCommon.toText(data['country_of_origin_map_url']),
      credits_used: genderApiCommon.toNumber(details['credits_used']),
    };
  },
});
