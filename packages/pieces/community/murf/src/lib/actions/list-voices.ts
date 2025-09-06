import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

export const listVoices = createAction({
  name: 'list_voices',
  displayName: 'List Voices',
  description: 'Lists all available voices in Murf AI',
  props: {
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Filter voices by language',
      required: false,
      options: {
        options: [
          { label: 'All Languages', value: 'all' },
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Hindi', value: 'hi' },
          // Add more languages as needed
        ],
      },
      defaultValue: 'all',
    }),
    gender: Property.Dropdown({
      displayName: 'Gender',
      description: 'Filter voices by gender',
      required: false,
      options: {
        options: [
          { label: 'All Genders', value: 'all' },
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ],
      },
      defaultValue: 'all',
    }),
    age: Property.Dropdown({
      displayName: 'Age Group',
      description: 'Filter voices by age group',
      required: false,
      options: {
        options: [
          { label: 'All Ages', value: 'all' },
          { label: 'Child', value: 'child' },
          { label: 'Young Adult', value: 'young_adult' },
          { label: 'Middle Age', value: 'middle_age' },
          { label: 'Senior', value: 'senior' },
        ],
      },
      defaultValue: 'all',
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { language, gender, age } = context.propsValue;

    const queryParams = {};
    if (language && language !== 'all') {
      queryParams['language'] = language;
    }
    if (gender && gender !== 'all') {
      queryParams['gender'] = gender;
    }
    if (age && age !== 'all') {
      queryParams['age'] = age;
    }

    const response = await makeRequest({
      method: HttpMethod.GET,
      apiKey,
      baseUrl,
      path: '/voices',
      queryParams,
    });

    return response;
  },
});