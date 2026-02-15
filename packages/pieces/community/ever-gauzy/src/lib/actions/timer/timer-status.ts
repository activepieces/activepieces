import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, TimeLogSourceEnum } from '../../common';

export const getTimerStatus = createAction({
    auth: gauzyAuth,
    name: 'get_timer_status',
    displayName: 'Get Timer Status',
    description: 'Retrieve the current status of timers',
    props: {
        tenant: Property.Object({
            displayName: 'Tenant',
            required: false,
            description: 'Tenant information',
        }),
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: false,
            description: 'ID of the tenant',
        }),
        organization: Property.Object({
            displayName: 'Organization',
            required: true,
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
        employeeId: Property.ShortText({
            displayName: 'Employee ID',
            required: false,
            description: 'ID of the employee',
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
        startDate: Property.DateTime({
            displayName: 'Start Date',
            required: false,
            description: 'Filter by start date',
        }),
        endDate: Property.DateTime({
            displayName: 'End Date',
            required: false,
            description: 'Filter by end date',
        }),
        employeeIds: Property.Array({
            displayName: 'Employee IDs',
            required: false,
            description: 'List of employee IDs to filter by',
        }),
        projectIds: Property.Array({
            displayName: 'Project IDs',
            required: false,
            description: 'List of project IDs to filter by',
        }),
        taskIds: Property.Array({
            displayName: 'Task IDs',
            required: false,
            description: 'List of task IDs to filter by',
        }),
        teamIds: Property.Array({
            displayName: 'Team IDs',
            required: false,
            description: 'List of team IDs to filter by',
        }),
        todayStart: Property.DateTime({
            displayName: 'Today Start',
            required: false,
            description: 'Filter by today\'s start time',
        }),
        todayEnd: Property.DateTime({
            displayName: 'Today End',
            required: false,
            description: 'Filter by today\'s end time',
        }),
        relations: Property.Array({
            displayName: 'Relations',
            required: false,
            description: 'Relations to include in the response',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (context.propsValue.tenant) {
            queryParams.append('tenant', JSON.stringify(context.propsValue.tenant));
        }
        
        if (context.propsValue.tenantId) {
            queryParams.append('tenantId', context.propsValue.tenantId);
        }
        
        if (context.propsValue.organization) {
            queryParams.append('organization', JSON.stringify(context.propsValue.organization));
        }
        
        if (context.propsValue.organizationId) {
            queryParams.append('organizationId', context.propsValue.organizationId);
        }
        
        if (context.propsValue.sentTo) {
            queryParams.append('sentTo', context.propsValue.sentTo);
        }
        
        if (context.propsValue.employeeId) {
            queryParams.append('employeeId', context.propsValue.employeeId);
        }
        
        if (context.propsValue.source) {
            queryParams.append('source', context.propsValue.source);
        }
        
        if (context.propsValue.startDate) {
            queryParams.append('startDate', context.propsValue.startDate);
        }
        
        if (context.propsValue.endDate) {
            queryParams.append('endDate', context.propsValue.endDate);
        }
        
        if (context.propsValue.employeeIds && context.propsValue.employeeIds.length > 0) {
            queryParams.append('employeeIds', JSON.stringify(context.propsValue.employeeIds));
        }
        
        if (context.propsValue.projectIds && context.propsValue.projectIds.length > 0) {
            queryParams.append('projectIds', JSON.stringify(context.propsValue.projectIds));
        }
        
        if (context.propsValue.taskIds && context.propsValue.taskIds.length > 0) {
            queryParams.append('taskIds', JSON.stringify(context.propsValue.taskIds));
        }
        
        if (context.propsValue.teamIds && context.propsValue.teamIds.length > 0) {
            queryParams.append('teamIds', JSON.stringify(context.propsValue.teamIds));
        }
        
        if (context.propsValue.todayStart) {
            queryParams.append('todayStart', context.propsValue.todayStart);
        }
        
        if (context.propsValue.todayEnd) {
            queryParams.append('todayEnd', context.propsValue.todayEnd);
        }
        
        if (context.propsValue.relations && context.propsValue.relations.length > 0) {
            queryParams.append('relations', JSON.stringify(context.propsValue.relations));
        }

        // Build the URL with query parameters
        const url = `${baseUrl}/api/timesheet/timer/status${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers,
        });

        return response.body;
    },
});
