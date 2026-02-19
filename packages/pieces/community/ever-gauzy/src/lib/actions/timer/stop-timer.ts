import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, TimeLogSourceEnum, TimeLogType } from '../../common';

export const stopTimer = createAction({
    auth: gauzyAuth,
    name: 'stop_timer',
    displayName: 'Stop Timer',
    description: 'Stop a running timer',
    props: {
        tenant: Property.Object({
            displayName: 'Tenant',
            required: false,
            description: 'Tenant information',
        }),
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: true,
            description: 'ID of the tenant',
        }),
        organization: Property.Object({
            displayName: 'Organization',
            required: false,
            description: 'Organization information',
        }),
        organizationId: Property.ShortText({
            displayName: 'Organization ID',
            required: true,
            description: 'ID of the organization',
        }),
        sentTo: Property.ShortText({
            displayName: 'Sent To',
            required: false,
            description: 'Recipient of the timer information',
        }),
        logType: Property.StaticDropdown({
            displayName: 'Log Type',
            required: false,
            description: 'Type of time log',
            defaultValue: TimeLogType.TRACKED,
            options: {
                options: Object.values(TimeLogType).map((type) => ({
                    label: type,
                    value: type,
                })),
            }
        }),
        source: Property.StaticDropdown({
            displayName: 'Source',
            required: false,
            description: 'Source of the timer',
            defaultValue: TimeLogSourceEnum.WEB_TIMER,
            options: {
                options: Object.values(TimeLogSourceEnum).map((source) => ({
                    label: source,
                    value: source,
                })),
            },
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
            description: 'Description of the timer activity',
        }),
        isBillable: Property.Checkbox({
            displayName: 'Is Billable',
            required: false,
            description: 'Whether the time is billable',
            defaultValue: false,
        }),
        version: Property.ShortText({
            displayName: 'Version',
            required: false,
            description: 'Version of the timer',
            defaultValue: '1.0.1',
        }),
        projectId: Property.ShortText({
            displayName: 'Project ID',
            required: false,
            description: 'ID of the associated project',
        }),
        taskId: Property.ShortText({
            displayName: 'Task ID',
            required: false,
            description: 'ID of the associated task',
        }),
        organizationContactId: Property.ShortText({
            displayName: 'Organization Contact ID',
            required: false,
            description: 'ID of the organization contact',
        }),
        organizationTeamId: Property.ShortText({
            displayName: 'Organization Team ID',
            required: false,
            description: 'ID of the organization team',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const body = {
            tenant: context.propsValue.tenant || {},
            tenantId: context.propsValue.tenantId,
            organization: context.propsValue.organization || {},
            organizationId: context.propsValue.organizationId,
            sentTo: context.propsValue.sentTo,
            logType: context.propsValue.logType || TimeLogType.TRACKED,
            source: context.propsValue.source || TimeLogSourceEnum.WEB_TIMER,
            description: context.propsValue.description,
            isBillable: context.propsValue.isBillable || false,
            version: context.propsValue.version || '1.0.1',
            projectId: context.propsValue.projectId,
            taskId: context.propsValue.taskId,
            organizationContactId: context.propsValue.organizationContactId,
            organizationTeamId: context.propsValue.organizationTeamId,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/timesheet/timer/stop`,
            headers,
            body,
        });

        return response.body;
    },
});
