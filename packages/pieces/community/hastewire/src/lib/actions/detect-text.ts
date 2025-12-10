import { createAction, Property } from "@activepieces/pieces-framework";
import { hastewireAuth } from "../common/auth";
import {AuthenticationType, httpClient, HttpMethod} from "@activepieces/pieces-common";

export const detectTextAction = createAction({
    name:'detect-text',
    auth:hastewireAuth,
    displayName:'Detect Text',
    description:'Analyzes text and returns the likelihood of it being AI-generated or human-written.',
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