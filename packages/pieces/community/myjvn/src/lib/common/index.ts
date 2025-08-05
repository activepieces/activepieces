import { Property } from '@activepieces/pieces-framework';

export const myjvnCommon = {
    baseUrl: 'https://jvndb.jvn.jp/myjvn',
    lang: Property.StaticDropdown({
        displayName: 'lang',
        description: 'language',
        required: true,
        options: {
        options: [
            {
            label: 'japanese',
            value: 'ja',
            },
            {
            label: 'english',
            value: 'en',
            },
        ],
        },
        defaultValue: 'ja'
    }),
    ft: Property.StaticDropdown({
      displayName: 'format',
      description: 'Response Format',
      required: true,
      options: {
        options: [
          {
            label: 'json',
            value: 'json',
          },
          {
            label: 'xml',
            value: 'xml',
          },
        ],
      },
      defaultValue: 'json'
    })
}