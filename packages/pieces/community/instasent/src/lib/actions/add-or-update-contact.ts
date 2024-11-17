import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getBaseUrl } from '../../index';
import { BOOLEAN_OPTIONS, IGNORED_ATTRIBUTES, LONG_TEXT_TYPES } from '../common/constants';

interface InstasentAuthType {
    apiKey: string;
    projectId: string;
    datasourceId: string;
}

export const addOrUpdateContact = createAction({
    name: 'add_or_update_contact',
    displayName: 'Add/Update contact',
    description: 'Add or update a single contact',

    props: {
        contact: Property.DynamicProperties({
            displayName: 'Contact Properties',
            description: 'Enter the contact properties, the User ID is mandatory',
            required: true,
            refreshers: ['authentication'],
            props: async ({ auth }) => {
                const authData = auth as InstasentAuthType;
                const baseUrl = getBaseUrl({
                    projectId: authData.projectId,
                    datasourceId: authData.datasourceId
                });

                try {
                    const response = await httpClient.sendRequest({
                        method: HttpMethod.GET,
                        url: `${baseUrl}/stream/specs/attributes`,
                        headers: {
                            'Authorization': `Bearer ${authData.apiKey}`
                        }
                    });

                    const properties: Record<string, any> = {};

                    [1,2,3,4,5].forEach((iteration) => {
                        for (const spec of response.body.specs) {
                            // Ignored properties
                            if (spec.readOnly || properties[spec.uid] || IGNORED_ATTRIBUTES.includes(spec.uid)) {
                                continue;
                            }
                            // Multiple iterations to sort the properties based on their attributes
                            if (iteration === 1 && !spec.requiredInWebhook) {
                                continue;
                            }
                            if (iteration === 2 && !spec.important) {
                                continue;
                            }
                            if (iteration === 3 && spec.visible === false) {
                                continue;
                            }
                            if (iteration === 4 && spec.custom) {
                                continue;
                            }
                            const displayLabel = spec.displayLabel;
                            let description = spec.description;
                            if (spec.dataType === 'date') {
                                description += ' (ISO 8601 format YYYY-MM-DD)';
                            }
                            if (spec.multivalue > 1) {
                                properties[spec.uid] = Property.Array({
                                    displayName: displayLabel,
                                    description: `${description} (Max ${spec.multivalue} values)`,
                                    required: spec.requiredInWebhook
                                });
                            } else if (spec.dataType === 'bool') {
                                properties[spec.uid] = Property.StaticDropdown({
                                    displayName: displayLabel,
                                    description: `${description} [0=false|1=true|null=unknown]`,
                                    required: spec.requiredInWebhook,
                                    options: {
                                        options: BOOLEAN_OPTIONS
                                    }
                                });
                            } else {
                                const PropType = LONG_TEXT_TYPES.includes(spec.dataType) ? Property.LongText : Property.ShortText;

                                properties[spec.uid] = PropType({
                                    displayName: displayLabel,
                                    description: description,
                                    required: spec.requiredInWebhook
                                });
                            }
                        }
                    })
                    return properties;
                } catch (error) {
                    throw new Error('Failed to load contact properties');
                }
            }
        })
    },

    async run(context) {
        const contact = context.propsValue.contact;
        const auth = context.auth as InstasentAuthType;
        const baseUrl = getBaseUrl({ projectId: auth.projectId, datasourceId: auth.datasourceId });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/stream/contacts`,
            headers: {
                'Authorization': `Bearer ${auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: [contact]
        });

        if (response.body.entitiesSuccess !== 1) {
            throw new Error(`Failed to add or update contact: ${JSON.stringify(response.body.errors)}`);
        }

        return response.body;
    }
});
