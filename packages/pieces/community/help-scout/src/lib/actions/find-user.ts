import { HttpMethod, propsValidation } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { helpScoutApiRequest } from '../common/api'
import { helpScoutAuth } from '../common/auth'

export const findUser = createAction({
    auth: helpScoutAuth,
    name: 'find_user',
    displayName: 'Find User',
    description: 'Finds a user by email.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        await propsValidation.validateZod(propsValue, {
            email: z.string().min(1, 'Please provide a valid email.'),
        })
        const response = await helpScoutApiRequest({
            method: HttpMethod.GET,
            url: `/users?email=${propsValue.email}`,
            auth,
        })

        const { _embedded } = response.body as {
            _embedded: {
                users: { id: number; firstName: string; lastName: string }[]
            }
        }

        return {
            found: _embedded.users.length > 0,
            data: _embedded.users.length > 0 ? _embedded.users[0] : {},
        }
    },
})
