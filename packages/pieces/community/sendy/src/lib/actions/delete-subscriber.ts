import { propsValidation } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { deleteSubscriber } from '../api'
import { SendyAuthType, sendyAuth } from '../auth'
import { buildListDropdown } from '../props'

export const deleteAction = createAction({
  name: 'delete_subscriber',
  auth: sendyAuth,
  displayName: 'Delete Subscriber',
  description: 'Delete a subscriber from a list',
  props: {
    list: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to delete from',
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

    return await deleteSubscriber(context.auth, {
      list_id: context.propsValue.list,
      email: context.propsValue.email,
    })
  },
})
