import { isNil } from "@activepieces/shared";
import { AI, AIChatRole, AIFactory } from "../..";
import {GoogleGenAI} from '@google/genai';

import { imageMapper, model, ModelType } from '../utils';

export const gemini: AIFactory = ({ proxyUrl, engineToken }): AI => {
    const geminiApiVersion = 'v1';
    const sdk = new GoogleGenAI({
        apiKey: engineToken,
        httpOptions:{
            baseUrl:`${proxyUrl}/${geminiApiVersion}`
        }
    });

    return{
        provider:'GEMINI',
        chat:{
            text: async (params)=>{
                const userMessage = params.messages.find(message => message.role === 'user');

                if(isNil(userMessage) || isNil(userMessage.content))
                {
                    throw new Error("Provide prompt value.")
                }

                const completion = await sdk.models.generateContent({
                    model:params.model,
                    contents: userMessage?.content,
                    config:{
                        maxOutputTokens:params.maxTokens
                    }
                })

                return{
                    choices:[
                        {
                            role:AIChatRole.ASSISTANT,
                            content:completion.text??'',
                        }
                    ],
                    created:completion.createTime,
                    model:params.model,
                    usage:completion.usageMetadata &&{
                        completionTokens: completion.usageMetadata.candidatesTokenCount!,
						promptTokens: completion.usageMetadata.promptTokenCount!,
						totalTokens: completion.usageMetadata.totalTokenCount!,
                    }
                    
                }
            }
        }
    }
}

export const geminiModels = [
    model({ label: 'gemini-2.0-flash', value: 'gemini-2.0-flash', supported: ['text'] }),
    model({
        label: 'gemini-2.0-flash-lite',
        value: 'gemini-2.0-flash-lite',
        supported: ['text'],
    }),
    model({label:'gemini-1.5-flash',value:'gemini-1.5-flash',supported:['text']})

];
