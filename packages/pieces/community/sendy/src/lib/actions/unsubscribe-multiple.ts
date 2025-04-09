import { propsValidation } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { unsubscribe } from '../api'
import { SendyAuthType, sendyAuth } from '../auth'
import { buildListDropdown } from '../props'

export const unsubscribeMultipleAction = createAction({
  name: 'unsubscribe_multiple',
  auth: sendyAuth,
  displayName: 'Unsubscribe Multiple Lists',
  description: 'Unsubscribe a subscriber from multiple lists',
  props: {
    lists: Property.MultiSelectDropdown({
      displayName: 'Lists',
      description: 'Select the lists to subscribe to',
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

    const returnValues: any[] = []

    for (const list of context.propsValue.lists) {
      const rc = await unsubscribe(context.auth, {
        list: list,
        email: context.propsValue.email,
      })
      returnValues.push(rc)
    }
    return returnValues
  },
})
