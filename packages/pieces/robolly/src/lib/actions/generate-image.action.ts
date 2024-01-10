import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { Property, createAction } from "@activepieces/pieces-framework";

export  const generateImage = createAction({
    description: 'Generate an image using Robolly',
    displayName: 'Generate Image',
    name: 'generate_image',
    props: {
        template_id: Property.ShortText({
            displayName: 'Template ID',
            required: true,
            description: 'The ID of the template to use.'
        }),
        format: Property.StaticDropdown({
            displayName: 'Format',
            required: true,
            description: 'The format of the image to generate.',
            defaultValue: 'jpg',
            options: {
                "options" : [
                    {
                        "label": "JPG",
                        "value": 'jpg',
                    },
                    {
                        "label": "PNG",
                        "value": 'png',
                    },
                    {
                        "label": "PDF",
                        "value": 'pdf',
                    }
                ]
            }
        }),
        modifications: Property.Object({
            displayName: 'Modifications',
            description: 'The modifications (fields) to apply to the image.',
            required: true,

        })
    },
    async run({ auth, propsValue }){

        const queryParams: Record<string, string> = {
        };

        queryParams['json'] = ""

       for (const key in propsValue.modifications) {
            const value = propsValue.modifications[key];
            queryParams[key as string] = value as string;
        }

        console.log(queryParams);
        
        const request = await httpClient.sendRequest({
            method: HttpMethod.GET,
            queryParams: queryParams,
            url: `https://api.robolly.com/templates/${propsValue.template_id}/render/${propsValue.format}`,
            headers: {
                'Authorization': `Bearer ${auth}`
            },
            body: propsValue.modifications
        });

        console.log(request);

        return request.body;
    }
});
