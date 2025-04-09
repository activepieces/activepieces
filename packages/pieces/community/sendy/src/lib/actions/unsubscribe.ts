import { propsValidation } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { unsubscribe } from '../api'
import { SendyAuthType, sendyAuth } from '../auth'
import { buildListDropdown } from '../props'

export const unsubscribeAction = createAction({
  name: 'unsubscribe',
  auth: sendyAuth,
  displayName: 'Unsubscribe',
  description: 'Unsubscribe a subscriber from a list',
  props: {
    list: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to unsubscribe from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => await buildListDropdown(auth as SendyAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The user's email",
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().email(),
    })

    return await unsubscribe(context.auth, {
      list: context.propsValue.list,
      email: context.propsValue.email,
    })
  },
})
