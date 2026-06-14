import { createAction, Property } from "@activepieces/pieces-framework";
import { hastewireAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const humanizeTextAction = createAction({
    name: 'humanize-text',
    auth: hastewireAuth,
    displayName: 'Humanize Text',
    description: 'Rephrases a given AI-generated text to be more human like.',
    audience: 'both',
    aiMetadata: { description: 'Rewrites AI-generated text into a more human-sounding version via the Hastewire API, optionally targeting a writing style (formal, standard, or academic). Choose this to make machine-written content read naturally or to reduce AI-detection signals. Each call performs a fresh generative rewrite, so it is not idempotent and repeated calls may return different output.', idempotent: false },
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