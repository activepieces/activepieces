import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, createTrigger, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';

export const newObjectTrigger = createTrigger({
    auth: jumpcloudAuth,
    name: 'new_object',
    classification: 'READ',
    displayName: 'New Object',
    description: 'Triggers when a new user, device, group or application appears in JumpCloud.',
    aiMetadata: {
        description:
            'Fires once per new JumpCloud object of the selected type (user, system/device, user group, device group or SSO application), checked every few minutes. Each run carries one object with its fields and object_type.',
    },
    props: newObjectProps(),
    sampleData: {
        object_type: 'user',
        id: '5f8a1c2b3d4e5f6a7b8c9d0e',
        username: 'jane.doe',
        email: 'jane.doe@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        display_name: 'Jane Doe',
        employee_id: 'E-1042',
        employee_type: 'Full-time',
        job_title: 'Software Engineer',
        department: 'Engineering',
        company: 'Example Inc.',
        cost_center: null,
        location: 'Remote',
        manager_id: null,
        state: 'ACTIVATED',
        activated: true,
        account_locked: false,
        suspended: false,
        password_expired: false,
        mfa_configured: false,
        totp_enabled: false,
        created: '2026-10-06T12:00:00.000Z',
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return pollingHelper.test(polling(), context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling(), context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling(), context);
    },
    async run(context) {
        return pollingHelper.poll(polling(), context);
    },
});

function newObjectProps() {
    return {
        objectType: jumpcloudProps.objectType({ description: 'The kind of new object to watch for.' }),
    };
}

function polling(): Polling<AppConnectionValueForAuthProperty<typeof jumpcloudAuth>, StaticPropsValue<NewObjectProps>> {
    return {
        strategy: DedupeStrategy.TIMEBASED,
        items: async ({ auth, propsValue, lastFetchEpochMS }) => {
            const type = jumpcloudObjects.parseType(propsValue.objectType);
            const records = await jumpcloudObjects.listNewest({
                auth: auth.props,
                type,
                since: lastFetchEpochMS,
                maxItems: lastFetchEpochMS === 0 ? TEST_ITEMS : MAX_ITEMS_PER_POLL,
            });
            return records
                .flatMap((record) => {
                    const epochMilliSeconds = jumpcloudObjects.createdAt({ type, record });
                    return epochMilliSeconds === null
                        ? []
                        : [{ epochMilliSeconds, data: { object_type: type, ...jumpcloudOutput.flatten({ type, record }) } }];
                })
                .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
        },
    };
}

const TEST_ITEMS = 100;
const MAX_ITEMS_PER_POLL = 1000;

type NewObjectProps = ReturnType<typeof newObjectProps>;
