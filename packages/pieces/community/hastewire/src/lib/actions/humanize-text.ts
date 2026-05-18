import { createAction, Property } from "@activepieces/pieces-framework";
import { hastewireAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const humanizeTextAction = createAction({
    name: 'humanize-text',
    auth: hastewireAuth,
    displayName: 'Humanize Text',
    description: 'Rephrases a given AI-generated text to be more human like.',
    props: {
        text: Property.LongText({
            displayName: 'Input Text',
            required: true
        }),
        style: Property.StaticDropdown({
            displayName: 'Text Style',
            required: false,
            description:'The desired writing style for the output.',
            options: {
                disabled: false,
                options: [
                    { label: 'formal', value: 'formal' },
                    { label: 'standard', value: 'standard' },
                    { label: 'academic', value: 'academic' }
                ]
            }
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://hastewire.com/api/v1/humanize',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.secret_text
            },
            body: {
                text: context.propsValue.text,
                style:context.propsValue.style
            }
        })

        return response.body;
    }
})