import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getBaseUrl, instasentAuth } from '../..';
import { ApiResponse, EventParameter, EventSpec, InstasentAuthType } from '../common/types';
import { BOOLEAN_OPTIONS } from '../common/constants';

export const createEvent = createAction({
    name: 'add_event',
    displayName: 'Add Event',
    description: 'Add a contact event',
    auth: instasentAuth,
    props: {
        user_id: Property.ShortText({
            displayName: 'User ID',
            description: 'Unique identifier of the user',
            required: true
        }),
        event_id: Property.ShortText({
            displayName: 'Event ID',
            description: 'Unique identifier for this event. Used for deduplication.',
            required: true
        }),
        event_date: Property.ShortText({
            displayName: 'Event Date',
            description: 'Date and time when the event occurred, will default to now (ISO 8601 format YYYY-MM-DDTHH:MM:SS.SSSZ)',
            required: false
        }),
        event_type: Property.Dropdown({
            displayName: 'Event Type',
            description: 'Select the type of event to create',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const authData = auth as InstasentAuthType;
                const baseUrl = getBaseUrl({
                    projectId: authData.projectId,
                    datasourceId: authData.datasourceId
                });

                const response = await httpClient.sendRequest<{ specs: EventSpec[] }>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}/stream/specs/events`,
                    headers: {
                        'Authorization': `Bearer ${authData.apiKey}`
                    }
                });

                return {
                    options: response.body.specs.map(spec => ({
                        label: `${spec.emoji} ${spec.name}`,
                        value: spec.uid
                    }))
                };
            }
        }),
        event_parameters: Property.DynamicProperties({
            displayName: 'Event Parameters',
            description: 'Parameters for the selected event type',
            required: true,
            refreshers: ['event_type'],
            props: async ({ auth, event_type }) => {
                if (!auth || !event_type) return {};
                const authData = auth as InstasentAuthType;
                const baseUrl = getBaseUrl({
                    projectId: authData.projectId,
                    datasourceId: authData.datasourceId
                });

                const response = await httpClient.sendRequest<{ specs: EventParameter[] }>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}/stream/specs/event-parameters/${event_type}`,
                    headers: {
                        'Authorization': `Bearer ${authData.apiKey}`
                    }
                });

                const props: Record<string, any> = {};

                response.body.specs.forEach(param => {
                    if (param.multiValue > 1) {
                        props[param.parameter] = Property.Array({
                            displayName: param.title,
                            description: `${param.description} (Max ${param.multiValue} values)`,
                            required: param.required
                        });
                    } else {
                        // Convert API parameter specs to ActivePieces properties
                        switch (param.dataType) {
                            case 'bool':
                                props[param.parameter] = Property.StaticDropdown({
                                    displayName: param.title,
                                    description: `${param.description} [0=false|1=true|null=unknown]`,
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
        const authData = auth as InstasentAuthType;
        const baseUrl = getBaseUrl({
            projectId: authData.projectId,
            datasourceId: authData.datasourceId
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
                'Authorization': `Bearer ${authData.apiKey}`,
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
