import { Property } from '@activepieces/pieces-framework'
import { convertkitAuth } from '../../..'
import { fetchForms } from '../../common/service'

export const formId = Property.Dropdown({
    displayName: 'Form',
    required: true,
    refreshers: ['auth'],
    auth: convertkitAuth,
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            }
        }

        const forms = await fetchForms(auth.secret_text)

        // loop through data and map to options
        const options = forms.map((field: { id: string; name: string }) => {
            return {
                label: field.name,
                value: field.id,
            }
        })

        return {
            options,
        }
    },
})
