/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { DynamicPropsValue, Property, createAction } from "@activepieces/pieces-framework";

export  const generateImage = createAction({
    description: 'Generate an image using Robolly',
    displayName: 'Generate Image',
    name: 'generate_image',
    props: {
        template_id: Property.Dropdown({
            displayName: 'Template',
            required: true,
            description: 'Select your template. (If you want to use Template ID. Click on the "(x)" above this field. Template ID can be found by opening a template and going to “Render”. Being there copy the template ID from the top right.)',
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Enter your API key first',
                        options: []
                    };
                }
                try {
                    const request = await httpClient.sendRequest({
                        method: HttpMethod.GET,
                        url: `https://api.robolly.com/v1/templates`,
                        headers: {
                            'Authorization': `Bearer ${auth}`
                        }
                    });

                    return {
                        disabled: false,
                        options: request.body['templates'].map((template: any) => {
                            return {
                                label: template.name,
                                value: template.id
                            };
                        })
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Couldn't load templates, API key is invalid"
                    };
                }
            }
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
        fields: Property.DynamicProperties({
            displayName: 'Values',
            description: 'The values to apply to the fields in the template.',
            required: true,
            refreshers: ["template_id"],
            props: async ({ auth, template_id }) => {
                if (!auth) return {};
                if (!template_id) return {};

                const fields: DynamicPropsValue = {};

                const request = await httpClient.sendRequest({
                        method: HttpMethod.GET,
                        url: `https://api.robolly.com/v1/templates/${template_id}/accepted-modifications`,
                        headers: {
                            'Authorization': `Bearer ${auth}`
                        }
                    });

                request.body['acceptedModifications'].map((field: any) => {
                    fields[field.key] = Property.ShortText({
                        displayName: field.key,
                        description: `Type: ${field.type}`,
                        required: false
                    })
                })
                return fields
            }
        }),
        modifications: Property.Object({
            displayName: 'Extra Modifications',
            description: 'The extra modifications to apply to the image. See "Detailed dynamic modifications" in https://robolly.com/docs/api-reference/',
            required: false,

        })
    },
    async run({ auth, propsValue }){

        const fields = propsValue.fields;

        const queryParams: Record<string, string> = {
        };

        queryParams['json'] = ""

       for (const key in propsValue.modifications) {
            const value = propsValue.modifications[key];
            queryParams[key as string] = value as string;
        }

        Object.keys(fields).forEach(k => {
            if (fields[k] !== '') {
                queryParams[k] = fields[k]
            }
        })

        const request = await httpClient.sendRequest({
            method: HttpMethod.GET,
            queryParams: queryParams,
            url: `https://api.robolly.com/templates/${propsValue.template_id}/render/${propsValue.format}`,
            headers: {
                'Authorization': `Bearer ${auth}`
            },
            body: propsValue.modifications
        });


        return request.body;
    }
});
