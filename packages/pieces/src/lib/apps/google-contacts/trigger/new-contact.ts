
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { getAccessTokenOrThrow } from '../../../common/helpers';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpResponse } from '../../../common/http/core/http-response';
import {
    createTrigger,
    TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { googleContactsCommon } from '../common';

export const googleContactNewOrUpdatedContact = createTrigger({
    name: 'new_or_updated_contact',
    displayName: 'New Or Updated Contact',
    description: 'Triggers when there is a new or updated contact',
    props: {
        authentication: googleContactsCommon.authentication,
    },
    sampleData: {
    },
    type: TriggerStrategy.POLLING,
    async onEnable(ctx) {
        const response = await listContacts(getAccessTokenOrThrow(ctx.propsValue['authentication']), undefined);
        console.log(`Saved sync token ${response.body.nextSyncToken}`);
        await ctx.store?.put("syncToken", response.body.nextSyncToken);
    },
    async onDisable(ctx) { },
    async run(ctx) {
        let newContacts: unknown[] = [];
        let fetchMore = true;
        while (fetchMore) {
            const syncToken: string = (await ctx.store?.get("syncToken"))!;
            const response = await listContacts(getAccessTokenOrThrow(ctx.propsValue['authentication']), syncToken);
            const newConnections = response.body.connections;
            await ctx.store?.put("syncToken", response.body.nextSyncToken);
            if (newConnections === undefined || newConnections.length == 0) {
                fetchMore = false;
            }
            if (newConnections !== undefined) {
                newContacts = [...newContacts, ...newConnections];
            }
        }
        console.log(`Found ${newContacts.length} new contacts`);
        return newContacts;
    },
});

function listContacts(access_token: string, syncToken: string | undefined): Promise<HttpResponse<{ connections: unknown[], nextSyncToken: string }>> {
    let qParams: Record<string, string> = {
        personFields: "Addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined",
        requestSyncToken: "true"
    };
    if (syncToken !== undefined) {
        qParams = {
            ...qParams,
            syncToken: syncToken
        }
    }
    return httpClient.sendRequest<{ connections: unknown[], nextSyncToken: string }>({
        method: HttpMethod.GET,
        url: googleContactsCommon.baseUrl + "/me/connections",
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: access_token,
        },
        queryParams: qParams
    });
}

