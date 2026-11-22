import { createAction, InputPropertyMap, MarkdownVariant, Property, tryCatch } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { instasentAuth } from '../auth';
import { instasentCommon } from '../common';
import { BOOLEAN_OPTIONS, IGNORED_ATTRIBUTES, LONG_TEXT_TYPES } from '../common/constants';
import { ContactAttributeSpec } from '../common/types';

const PROPERTY_ITERATIONS = [
    { check: (spec: ContactAttributeSpec) => spec.requiredInWebhook },
    { check: (spec: ContactAttributeSpec) => spec.important },
    { check: (spec: ContactAttributeSpec) => spec.visible !== false },
    { check: (spec: ContactAttributeSpec) => !spec.custom },
    { check: () => true }
];

export const addOrUpdateContact = createAction({
    name: 'add_or_update_contact',
    classification: 'WRITE',
    displayName: 'Save Contact',
    description: 'Creates a contact, or updates it if the User ID already exists.',
    audience: 'both',
    aiMetadata: { description: 'Upserts one contact in an Instasent datasource, keyed on the contact User ID (mandatory) — creates it if new, updates it otherwise. Use to push or sync contact attributes; the available attribute fields are loaded dynamically from the datasource. Enable the Instant option only when a following step must add an event for this contact (it processes synchronously instead of queuing). Idempotent: re-running with the same User ID and data converges to the same contact.', idempotent: true },
    auth: instasentAuth,
    propertyGroups: [
        { key: 'contact', display: 'section', label: 'Contact', icon: 'user', props: ['contact_note', 'contact'] }
    ],
    props: {
        contact_note: Property.MarkDown({
            value: 'The **User ID** identifies the contact. If a contact with that ID exists, it is updated; otherwise it is created.',
            variant: MarkdownVariant.INFO
        }),
        contact: Property.DynamicProperties({
            auth: instasentAuth,
            displayName: 'Contact Properties',
            description: 'Enter the contact properties, the User ID is mandatory',
            required: true,
            refreshers: ['authentication'],
            props: async ({ auth }): Promise<InputPropertyMap> => {
                if (!auth) {
                    return {};
                }
                const authData = auth;
                const baseUrl = instasentCommon.getBaseUrl({
                    projectId: authData.props.projectId,
                    datasourceId: authData.props.datasourceId
                });

                const { data: response, error } = await tryCatch(() =>
                    httpClient.sendRequest<{ specs: ContactAttributeSpec[] }>({
                        method: HttpMethod.GET,
                        url: `${baseUrl}/stream/specs/attributes`,
                        headers: {
                            'Authorization': `Bearer ${authData.props.apiKey}`
                        }
                    })
                );

                if (error || !response) {
                    throw new Error('Failed to load contact properties');
                }

                const properties: InputPropertyMap = {};

                for (const iteration of PROPERTY_ITERATIONS) {
                    for (const spec of response.body.specs) {
                        if (spec.readOnly || properties[spec.uid] || IGNORED_ATTRIBUTES.includes(spec.uid)) {
                            continue;
                        }

                        if (!iteration.check(spec)) {
                            continue;
                        }

                        const displayLabel = spec.displayLabel;
                        const description = spec.description;
                        if (spec.multivalue > 1) {
                            properties[spec.uid] = Property.Array({
                                displayName: displayLabel,
                                description: `${description} (Max ${spec.multivalue} values)`,
                                required: spec.requiredInWebhook
                            });
                        } else if (spec.dataType === 'bool') {
                            properties[spec.uid] = Property.StaticDropdown({
                                displayName: displayLabel,
                                description: description,
                                required: spec.requiredInWebhook,
                                options: {
                                    options: BOOLEAN_OPTIONS
                                }
                            });
                        } else if (LONG_TEXT_TYPES.includes(spec.dataType)) {
                            properties[spec.uid] = Property.LongText({
                                displayName: displayLabel,
                                description: description,
                                required: spec.requiredInWebhook
                            });
                        } else {
                            properties[spec.uid] = Property.ShortText({
                                displayName: displayLabel,
                                description: description,
                                required: spec.requiredInWebhook,
                                ...(spec.dataType === 'date' ? { placeholder: 'YYYY-MM-DD' } : {})
                            });
                        }
                    }
                }

                return properties;
            }
        }),
        instant: Property.Checkbox({
            displayName: 'Process Immediately',
            description: 'Skips the queue. Turn on only if a later step adds an event for this contact.',
            required: false,
            defaultValue: false,
            advanced: true
        })
    },

    async run(context) {
        const contact = context.propsValue.contact;
        const instant = context.propsValue.instant;
        const auth = context.auth;
        const baseUrl = instasentCommon.getBaseUrl({ projectId: auth.props.projectId, datasourceId: auth.props.datasourceId });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/stream/contacts${instant ? '?_sync' : ''}`,
            headers: {
                'Authorization': `Bearer ${auth.props.apiKey}`,
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
