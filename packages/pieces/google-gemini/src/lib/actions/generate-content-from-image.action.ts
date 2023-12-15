import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleGeminiAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";


export const generateContentFromImageAction = createAction({
    description: 'Generate content using Google Gemini using the "gemini-pro-vision" model',
    displayName: 'Generate Content from Image',
    name: 'generate_content_from_image',
    auth: googleGeminiAuth,
    props: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            required: true,
            description: 'The prompt to generate content from.'
        }),
        image_base64: Property.LongText({
            displayName: 'Image in Base64',
            required: true,
            description: 'The image to generate content from. Base64 encoded.',
        }),
        mime_type: Property.ShortText({
            displayName: 'Mime Type',
            required: true,
            description: 'The mime type of the image. Example: image/jpeg',
        })
    },
    async run({ auth, propsValue }){
        
        const request = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${auth}`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": propsValue.prompt
                            }, 
                            {
                                "inline_data": {
                                    "mime_type": propsValue.mime_type,
                                    "data": propsValue.image_base64
                                }
                            }
                        ]
                    }
                ]
            }
        });
        return request.body;
    }
});