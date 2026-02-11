import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { gauzyAuth, gauzyWebhookCommon, GauzyWebhookInformation, TimeLogSourceEnum } from '../common';

const triggerNameInStore = 'gauzy_new_time_track_trigger';

export const newTimeTrack = createTrigger({
    auth: gauzyAuth,
    name: 'new_time_track',
    displayName: 'Timer Tracker',
    description: 'Triggers when a new time tracking entry is created in Gauzy',
    type: TriggerStrategy.WEBHOOK,
    props: {
        tenantId: gauzyWebhookCommon.tenantId,
        organizationId: gauzyWebhookCommon.organizationId,
        employeeId: Property.ShortText({
            displayName: 'Employee ID',
            required: false,
            description: 'Filter time tracking events by employee ID (optional)',
        }),
        includeDetails: Property.Checkbox({
            displayName: 'Include Details',
            required: false,
            description: 'Include detailed information about the time entry, employee, and project',
            defaultValue: true,
        }),
    },
    sampleData: {
        id: 'sample-time-entry-id',
        employeeId: 'sample-employee-id',
        projectId: 'sample-project-id',
        startedAt: '2024-05-06T09:00:00.000Z',
        stoppedAt: '2024-05-06T17:00:00.000Z',
        duration: 28800, // 8 hours in seconds
        description: 'Working on feature implementation',
        isBillable: true,
        source: TimeLogSourceEnum.WEB_TIMER,
        tenantId: 'sample-tenant-id',
        organizationId: 'sample-organization-id',
    },
    async onEnable(context) {
        // Create the event filter based on props
        const eventFilter: Record<string, unknown> = {
            organizationId: context.propsValue.organizationId,
            tenantId: context.propsValue.tenantId,
        };

        if (context.propsValue.employeeId) {
            eventFilter['employeeId'] = context.propsValue.employeeId;
        }

        const webhookId = await gauzyWebhookCommon.createWebhook(
            context.auth,
            context.webhookUrl,
            context.propsValue.tenantId,
            (context.propsValue.organizationId as string) || '',
            ['timesheet.time-log.created'],
            eventFilter
        );

        await context.store.put<GauzyWebhookInformation>(triggerNameInStore, {
            webhookId: webhookId,
        });
    },

    async onDisable(context) {
        const response = await context.store.get<GauzyWebhookInformation>(triggerNameInStore);

        if (response !== null && response !== undefined) {
            await gauzyWebhookCommon.deleteWebhook(context.auth, response.webhookId);
        }
    },

    async run(context) {
        return [context.payload.body];
    },
});