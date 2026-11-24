import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import {
    disableNewObjectTrigger,
    enableNewObjectTrigger,
    listRecentObjects,
    NewObjectTriggerConfig,
    pollNewObjects,
} from '../common';

const CONFIG: NewObjectTriggerConfig = {
    stateKey: '_new_group_state',
    legacyDeltaKey: '_delta_link_new_group',
    deltaPath: '/groups/delta',
    objectPath: '/groups',
    select: 'id,displayName,description,mail,mailNickname,visibility,groupTypes,securityEnabled,mailEnabled,createdDateTime',
    arrayKeys: ['groupTypes'],
};

export const newGroupTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_group',
    classification: 'READ',
    displayName: 'New Group',
    description: 'Triggers when a new group is created in Microsoft Entra ID.',
    aiMetadata: {
        description: 'Fires once for each group (security or Microsoft 365) created in Microsoft Entra ID after the trigger was enabled, detected by polling the Microsoft Graph groups delta query. Each event is one group with id, displayName, description, mail, mailNickname, visibility, groupTypes, securityEnabled, mailEnabled and createdDateTime. Updates to existing groups do not fire it; a group that reaches the directory late (up to 24 hours) still fires once.',
    },
    type: TriggerStrategy.POLLING,
    props: {},
    outputSchema: {
        fields: [
            { key: 'id', label: 'Group ID' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'description', label: 'Description' },
            { key: 'mail', label: 'Mail', format: 'email' },
            { key: 'mailNickname', label: 'Mail Nickname' },
            { key: 'visibility', label: 'Visibility' },
            { key: 'groupTypes', label: 'Group Types' },
            { key: 'securityEnabled', label: 'Security Enabled', format: 'boolean' },
            { key: 'mailEnabled', label: 'Mail Enabled', format: 'boolean' },
            { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
        ],
    },
    sampleData: {
        id: '2ff8f722-0191-4c16-a378-a8fb4efec110',
        displayName: 'testGroup6',
        description: null,
        mail: null,
        mailNickname: 'team-theta4',
        visibility: null,
        groupTypes: [],
        securityEnabled: true,
        mailEnabled: false,
        createdDateTime: '2026-04-22T08:29:29Z',
    },
    async onEnable(context) {
        await enableNewObjectTrigger({
            accessToken: context.auth.access_token,
            store: context.store,
            config: CONFIG,
            isRepublish: context.isRepublish === true,
        });
    },
    async onDisable(context) {
        if (context.isRepublish) {
            return;
        }
        await disableNewObjectTrigger({ store: context.store, config: CONFIG });
    },
    async test(context) {
        return listRecentObjects({ accessToken: context.auth.access_token, config: CONFIG });
    },
    async run(context) {
        return pollNewObjects({ accessToken: context.auth.access_token, store: context.store, config: CONFIG });
    },
});
