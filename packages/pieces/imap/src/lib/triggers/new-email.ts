import { FilesService, PiecePropValueSchema, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { imapCommon } from '../common';

import dayjs from 'dayjs';
import { imapAuth } from '../..';
import { Attachment, ParsedMail } from 'mailparser';

const polling: Polling<PiecePropValueSchema<typeof imapAuth>, { subject: string | undefined, to: string | undefined, from: string | undefined }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const imapConfig = {
            host: auth.host,
            user: auth.username,
            password: auth.password,
            port: auth.port,
            tls: auth.tls
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
        const items = currentValues.map((item) => ({
            epochMilliSeconds: dayjs(item.date).valueOf(),
            data: item
        }));
        return items;
    }
};

async function convertAttachment(attachments: Attachment[], files: FilesService) {
    const promises = attachments.map(async (attachment) => {
        return files.write({
            fileName: attachment.filename ?? `attachment-${Date.now()}`,
            data: attachment.content,
        });
    });
    return Promise.all(promises);
}

export const newEmail = createTrigger({
    auth: imapAuth,
    name: 'new_email',
    displayName: 'New Email',
    description: 'Trigger when a new email is received.',
    props: {
        subject: imapCommon.subject,
        to: imapCommon.to,
        from: imapCommon.from
    },
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        const items = await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
        const convertedItems = await Promise.all(items.map(async (item) => {
            const castedItem = item as ParsedMail;
            return {
                ...castedItem,
                attachments: await convertAttachment(castedItem.attachments, context.files)
            }
        }
        ));
        return convertedItems;
    },
    test: async (context) => {
        const items = await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
        const convertedItems = await Promise.all(items.map(async (item) => {
            const castedItem = item as ParsedMail;
            return {
                ...castedItem,
                attachments: await convertAttachment(castedItem.attachments, context.files)
            }
        }));
        return convertedItems;
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
