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
    stateKey: '_new_user_state',
    legacyDeltaKey: '_delta_link_new_user',
    deltaPath: '/users/delta',
    objectPath: '/users',
    select: 'id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,mobilePhone,accountEnabled,createdDateTime',
};

export const newUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_user',
    classification: 'READ',
    displayName: 'New User',
    description: 'Triggers when a new user is created in Microsoft Entra ID.',
    aiMetadata: {
        description: 'Fires once for each user account created in Microsoft Entra ID after the trigger was enabled, detected by polling the Microsoft Graph users delta query. Each event is one user with id, displayName, userPrincipalName, mail, givenName, surname, jobTitle, mobilePhone, accountEnabled and createdDateTime. Updates to existing users do not fire it; a user that reaches the directory late (up to 24 hours) still fires once.',
    },
    type: TriggerStrategy.POLLING,
    props: {},
    outputSchema: {
        fields: [
            { key: 'id', label: 'User ID' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
            { key: 'mail', label: 'Mail', format: 'email' },
            { key: 'givenName', label: 'Given Name' },
            { key: 'surname', label: 'Surname' },
            { key: 'jobTitle', label: 'Job Title' },
            { key: 'mobilePhone', label: 'Mobile Phone' },
            { key: 'accountEnabled', label: 'Account Enabled', format: 'boolean' },
            { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
        ],
    },
    sampleData: {
        id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        displayName: 'Ada Lovelace',
        userPrincipalName: 'ada@contoso.onmicrosoft.com',
        mail: 'ada@contoso.com',
        givenName: 'Ada',
        surname: 'Lovelace',
        jobTitle: 'Mathematician',
        mobilePhone: '+1 555 0100',
        accountEnabled: true,
        createdDateTime: '2026-04-22T10:15:30Z',
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
