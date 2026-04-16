import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { sessionAuth } from '../..'
import { baseUrl, getEvents } from '../common'

export const publishEvent = createAction({
    auth: sessionAuth,
    name: 'publish_event',
    displayName: 'Publish Event',
    description: 'Quickly publish an event.',
    props: {
        event: Property.Dropdown({
            auth: sessionAuth,
            displayName: 'Event',
            description: 'The event you want to publish.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                    }
                }

                const events = await getEvents(auth.secret_text)
                return {
                    options: events.map((event) => {
                        return {
                            label: event.session.name,
                            value: event.id,
                        }
                    }),
                }
            },
        }),
    },

    async run({ propsValue, auth }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/events/${propsValue.event}/publish`,
            headers: {
                'x-api-key': auth.secret_text,
            },
        })
        return response.body
    },
})
