import { HttpMethod } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { callSevenApi } from '../common'
import { sevenAuth } from '../index'

export const lookup = createAction({
  auth: sevenAuth,
  name: 'lookup',
  displayName: 'Lookup Phone Numbers',
  description: 'Get information about CNAM, HLR, MNP, RCS capabilities and Number formats.',
  props: {
    type: Property.StaticDropdown<string, true>({
      options: {
        options: [
          { label: 'CNAM', value: 'cnam' },
          { label: 'HLR', value: 'hlr' },
          { label: 'Format', value: 'format' },
          { label: 'MNP', value: 'mnp' },
          { label: 'RCS capabilities', value: 'rcs' },
        ],
      },
      displayName: 'Type',
      required: true,
    }),
    numbers: Property.Array({
      description: 'The phone numbers to look up.',
      displayName: 'Numbers',
      required: true,
    }),
  },
  async run(context) {
    const { numbers, type } = context.propsValue

    const response = await callSevenApi(
      {
        queryParams: {
          number: numbers.join(','),
        },
        method: HttpMethod.GET,
      },
      `lookup/${type}`,
      context.auth as string,
    )

    return response.body
  },
})
