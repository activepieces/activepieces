import { createAction, Property } from "@activepieces/pieces-framework";
import { dashworksAuth } from "../common/auth";
import {AuthenticationType, httpClient, HttpMethod} from "@activepieces/pieces-common";

export const generateAnswerAction = createAction({
    name:'generate-answer',
    auth:dashworksAuth,
    displayName:'Generate Answer',
    description:'Generates an answer from a Dashworks bot.',
    props:{
        botId:Property.ShortText({
            displayName:'Bot ID',
            required:true,
            description:"You can find this by going to Dashworks > Bots, clicking on an existing Bot, and using the 'Copy Bot ID' button on the top right."
        }),
        message:Property.LongText({
            displayName:'Message',
            required:true,
            description:'The message (e.g., a question or prompt) that you want a response to.'
        }),
        inlineSources:Property.Checkbox({
            displayName:'Inline Sources',
            required:false,
            description:'When true (default), sources will be cited inline in markdown formatting within the answer text.When false, the answer will not contain inline citations.'
        })
    },
    async run(context)
    {
        const {botId,message,inlineSources} = context.propsValue;

        const response = await httpClient.sendRequest({
            method:HttpMethod.POST,
            url:'https://api.dashworks.ai/v1/answer',
            authentication:{
                type:AuthenticationType.BEARER_TOKEN,
                token:context.auth.secret_text
            },
            body:{
                message,
                bot_id:botId,
                inline_sources:inlineSources
            }
        })

        return response.body;
    }
})