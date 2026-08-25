import { createAction, Property } from "@activepieces/pieces-framework";
import { hastewireAuth } from "../common/auth";
import {AuthenticationType, httpClient, HttpMethod} from "@activepieces/pieces-common";

export const detectTextAction = createAction({
    name:'detect-text',
    auth:hastewireAuth,
    displayName:'Detect Text',
    description:'Analyzes text and returns the likelihood of it being AI-generated or human-written.',
    audience: 'both',
    aiMetadata: { description: 'Runs AI-detection on a block of text via the Hastewire API, scoring how likely it is to be AI-generated versus human-written. Choose this to classify or vet content before acting on it; it only reads/analyzes the supplied text and does not modify or store it, so repeating the same input yields the same score.', idempotent: true },
    props:{
        text:Property.LongText({
            displayName:'Input Text',
            required:true
        })
    },
    async run(context)
    {
        const response = await httpClient.sendRequest({
            method:HttpMethod.POST,
            url:'https://hastewire.com/api/v1/detect',
            authentication:{
                type:AuthenticationType.BEARER_TOKEN,
                token:context.auth.secret_text
            },
            body:{
                text:context.propsValue.text
            }
        })

        return response.body;
    }
})