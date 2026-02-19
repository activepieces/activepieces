import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, TimeLogSourceEnum, TimeLogType, dynamicProps } from '../../common';

interface StartTimerBody {
    tenantId: string;
    organizationId: unknown;
    logType: TimeLogType;
    source: TimeLogSourceEnum;
    isBillable: boolean;
    description?: string;
    projectId?: unknown;
    employeeId?: unknown;
    organizationTeamId?: unknown;
}

export const startTimer = createAction({
    auth: gauzyAuth,
    name: 'start_timer',
    displayName: 'Start Timer',
    description: 'Start a new timer tracking in Gauzy',
    props: {
        organizationId: dynamicProps.organizations,
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: true,
            description: 'ID of the tenant',
        }),
        projectId: dynamicProps.projects,
        employeeId: dynamicProps.employees,
        teamId: dynamicProps.teams,
        description: Property.LongText({
            displayName: 'Activity Description',
            required: false,
            description: 'Description of what you are working on',
        }),
        logType: Property.StaticDropdown({
            displayName: 'Time Log Type',
            required: false,
            description: 'Type of time tracking',
            defaultValue: TimeLogType.TRACKED,
            options: {
                options: Object.values(TimeLogType).map((type) => ({
                    label: type.replace('_', ' '),
                    value: type,
                })),
            }
        }),
        source: Property.StaticDropdown({
            displayName: 'Timer Source',
            required: false,
            description: 'Source platform for the timer',
            defaultValue: TimeLogSourceEnum.WEB_TIMER,
            options: {
                options: Object.values(TimeLogSourceEnum).map((source) => ({
                    label: source.replace('_', ' '),
                    value: source,
                })),
            },
        }),
        isBillable: Property.Checkbox({
            displayName: 'Billable Time',
            required: false,
            description: 'Mark this time as billable to client',
            defaultValue: false,
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const body: StartTimerBody = {
            tenantId: context.propsValue.tenantId,
            organizationId: context.propsValue.organizationId,
            logType: context.propsValue.logType || TimeLogType.TRACKED,
            source: context.propsValue.source || TimeLogSourceEnum.WEB_TIMER,
            isBillable: context.propsValue.isBillable || false,
        };

        // Add optional fields if provided
        if (context.propsValue.description) body.description = context.propsValue.description;
        if (context.propsValue.projectId) body.projectId = context.propsValue.projectId;
        if (context.propsValue.employeeId) body.employeeId = context.propsValue.employeeId;
        if (context.propsValue.teamId) body.organizationTeamId = context.propsValue.teamId;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/timesheet/timer/start`,
            headers,
            body,
        });

        return response.body;
    },
});
