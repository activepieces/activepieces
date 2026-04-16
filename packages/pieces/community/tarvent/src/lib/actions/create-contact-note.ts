import { propsValidation } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { z } from 'zod'
import { tarventAuth } from '../auth'
import { makeClient, tarventCommon } from '../common'

export const createContactNote = createAction({
    auth: tarventAuth,
    name: 'tarvent_create_contact_note',
    displayName: 'Add Note To Contact',
    description: 'Adds a note to a contact.',
    props: {
        contactId: tarventCommon.contactId,
        note: Property.LongText({
            displayName: 'Note',
            description: 'Enter the note you would like to add to the contact.',
            required: true,
        }),
    },
    async run(context) {
        const { contactId, note } = context.propsValue

        await propsValidation.validateZod(context.propsValue, {
            note: z.string().min(1).max(255, 'Description has to be less than 256 characters.'),
        })

        const client = makeClient(context.auth)
        return await client.createContactNote(contactId, note)
    },
})
