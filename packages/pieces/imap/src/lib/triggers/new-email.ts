import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { imapCommon } from '../common';

import dayjs from 'dayjs';

const polling: Polling<{ authentication: any, subject: string | undefined, to: string | undefined, from: string | undefined }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        const imapConfig = {
            host: propsValue.authentication.host,
            user: propsValue.authentication.username,
            password: propsValue.authentication.password,
            port: propsValue.authentication.port,
            tls: propsValue.authentication.tls
        };

        // When generating sample data, lastFetchEpochMS is 0, which breaks the trigger
        const since = lastFetchEpochMS > 0 ? lastFetchEpochMS : dayjs().subtract(1, 'day').valueOf()
        const search = {
            flag: 'ALL',
            since: ['SINCE', since],
            subject: propsValue.subject,
            to: propsValue.to,
            from: propsValue.from
        }

        const currentValues = await imapCommon.fetchEmails(imapConfig, search) ?? [];
        const items = currentValues.map((item: { date: string }) => ({
            epochMilliSeconds: dayjs(item.date).valueOf(),
            data: item
        }));
        return items;
    }
};

export const newEmail = createTrigger({
    name: 'new_email',
    displayName: 'New Email',
    description: 'Trigger when a new email is received.',
    props: {
        authentication: imapCommon.authentication,
        subject: imapCommon.subject,
        to: imapCommon.to,
        from: imapCommon.from
    },
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    sampleData: {
        html: 'My email body',
        text: 'My email body',
        textAsHtml: '<p>My email body</p>',
        subject: 'Email Subject',
        date: '2023-06-18T11:30:09.000Z',
        to: {
            value: [
                {
                    address: 'email@address.com',
                    name: 'Name'
                }
            ]
        },
        from: {
            value: [
                {
                    address: 'email@address.com',
                    name: 'Name'
                }
            ]
        },
        cc: {
            value: [
                {
                    address: 'email@address.com',
                    name: 'Name'
                }
            ]
        },
        messageId: '<CxE49ifJT5YZN9OE2O6j6Ef+BYgkKWq7X-deg483GkM1ui1xj3g@mail.gmail.com>'
    }
});