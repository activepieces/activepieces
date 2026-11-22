import { createAction, InputPropertyMap, MarkdownVariant, Property, tryCatch } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { instasentAuth } from '../auth';
import { instasentCommon } from '../common';
import { ApiResponse, EventParameter, EventSpec } from '../common/types';
import { BOOLEAN_OPTIONS } from '../common/constants';

export const createEvent = createAction({
    name: 'add_event',
    classification: 'WRITE',
    displayName: 'Add Event',
    description: 'Records an event for a contact.',
    audience: 'both',
    aiMetadata: { description: 'Records a contact event in Instasent for a given User ID and event type (selected from the datasource event specs), with event-type-specific parameters loaded dynamically. Use to track an activity or behavior against a contact. Requires an Event ID, which the platform uses to deduplicate — sending the same Event ID again will not create a duplicate, so the call is idempotent on Event ID.', idempotent: true },
    auth: instasentAuth,
    propertyGroups: [
        {
            key: 'event',
            display: 'section',
            label: 'Event',
            icon: 'calendar',
            props: ['event_note', 'user_id', 'event_id', 'event_date']
        },
        {
            key: 'details',
            display: 'section',
            label: 'Details',
            icon: 'tag',
            props: ['event_type', 'event_parameters']
        }
    ],
    props: {
        event_note: Property.MarkDown({
            value: 'Sending the same **Event ID** again does not create a duplicate.',
            variant: MarkdownVariant.INFO
        }),
        user_id: Property.ShortText({
            displayName: 'User ID',
            description: "The contact's User ID.",
            placeholder: 'user-1234',
            required: true,
            width: 'half'
        }),
        event_id: Property.ShortText({
            displayName: 'Event ID',
            description: 'Any unique value, such as an order number.',
            placeholder: 'order-1234',
            required: true,
            width: 'half'
        }),
        event_date: Property.ShortText({
            displayName: 'Event Date',
            description: 'When the event happened. Empty: the current time.',
            placeholder: '2026-01-31T14:30:00Z',
            required: false
        }),
        event_type: Property.Dropdown({
            auth: instasentAuth,
            displayName: 'Event Type',
            description: 'Event types come from your Instasent datasource.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first',
                    };
                }
                const baseUrl = instasentCommon.getBaseUrl({
                    projectId: auth.props.projectId,
                    datasourceId: auth.props.datasourceId
                });

                const { data: response, error } = await tryCatch(() => httpClient.sendRequest<{ specs: EventSpec[] }>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}/stream/specs/events`,
                    headers: {
                        'Authorization': `Bearer ${auth.props.apiKey}`
                    }
                }));

                if (error || !response) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Could not load event types. Check your connection.',
                    };
                }

                if (response.body.specs.length === 0) {
                    return {
                        disabled: false,
                        options: [],
                        placeholder: 'No event types found in this datasource.',
                    };
                }

                return {
                    disabled: false,
                    options: response.body.specs.map(spec => ({
                        label: `${spec.emoji} ${spec.name}`,
                        value: spec.uid
                    }))
                };
            }
        }),
        event_parameters: Property.DynamicProperties({
            auth: instasentAuth,
            displayName: 'Event Parameters',
            description: 'Parameters for the selected event type',
            required: true,
            refreshers: ['event_type'],
            props: async ({ auth, event_type }): Promise<InputPropertyMap> => {
                if (!auth || !event_type) return {};
                const baseUrl = instasentCommon.getBaseUrl({
                    projectId: auth.props.projectId,
                    datasourceId: auth.props.datasourceId
                });

                const { data: response, error } = await tryCatch(() => httpClient.sendRequest<{ specs: EventParameter[] }>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}/stream/specs/event-parameters/${event_type}`,
                    headers: {
                        'Authorization': `Bearer ${auth.props.apiKey}`
                    }
                }));

                if (error || !response) {
                    throw new Error('Failed to load event parameters');
                }

                const props: InputPropertyMap = {};

                response.body.specs.forEach(param => {
                    if (param.multiValue > 1) {
                        props[param.parameter] = Property.Array({
                            displayName: param.title,
                            description: `${param.description} (Max ${param.multiValue} values)`,
                            required: param.required
                        });
                    } else {
                        switch (param.dataType) {
                            case 'bool':
                                props[param.parameter] = Property.StaticDropdown({
                                    displayName: param.title,
                                    description: param.description,
                                    required: param.required,
                                    options: {
                                        options: BOOLEAN_OPTIONS
                                    }
                                })
                                break;
                            case "string":
                            case "payload":
                                props[param.parameter] = Property.LongText({
                                    displayName: param.title,
                                    description: param.description,
                                    required: param.required
                                });
                                break;
                            default:
                                props[param.parameter] = Property.ShortText({
                                    displayName: param.title,
                                    description: param.description,
                                    required: param.required
                                });
                                break;
                        }
                    }
                });

                return props;
            }
        })
    },
    async run({ auth, propsValue }) {
        const baseUrl = instasentCommon.getBaseUrl({
            projectId: auth.props.projectId,
            datasourceId: auth.props.datasourceId
        });

        const eventData = {
            _user_id: propsValue.user_id,
            _event_id: propsValue.event_id,
            _event_type: propsValue.event_type,
            _event_date: propsValue.event_date,
            _event_parameters: propsValue.event_parameters
        };

        const response = await httpClient.sendRequest<ApiResponse<typeof eventData>>({
            method: HttpMethod.POST,
            url: `${baseUrl}/stream/events`,
            headers: {
                'Authorization': `Bearer ${auth.props.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: [eventData]
        });

        if (response.body.entitiesSuccess !== 1) {
            throw new Error(`Failed to create event: ${JSON.stringify(response.body.errors)}`);
        }

        return response.body;
    }
});
