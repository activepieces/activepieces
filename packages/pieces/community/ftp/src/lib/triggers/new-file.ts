
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property  } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { ftpAuth } from '../..';
import { Client } from 'basic-ftp';

// replace auth with piece auth variable
const polling: Polling<
PiecePropValueSchema<typeof ftpAuth>,
{ path: string; ignoreHiddenFiles?: boolean }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { host, port, user, password, secure } = auth;
        const client = new Client();

        try {
            await client.access({
                host,
                port,
                user,
                password,
                secure
            });
            let files = await client.list(propsValue.path);
            client.close();

            files = files.filter(
                (file) => dayjs(file.modifiedAt).valueOf() > lastFetchEpochMS
              );
              if ((propsValue.ignoreHiddenFiles ?? false) === true)
                files = files.filter((file) => !file.name.startsWith('.'));
        
              return files.map((file) => ({
                data: {
                  ...file,
                  path: `${propsValue.path}/${file.name}`,
                },
                epochMilliSeconds: dayjs(file.modifiedAt).valueOf(),
              }));
            } catch (err) {
              return [];
            }
          },
        };
        

export const newFile = createTrigger({
    auth: ftpAuth,
    name: 'newFile',
    displayName: 'New file',
    description: 'New file in FTP folder',
    props:  {
        path: Property.ShortText({
        displayName: 'Path',
        description: 'The path to watch for new files',
        required: true,
        defaultValue: './',
        }),
        ignoreHiddenFiles: Property.Checkbox({
        displayName: 'Ignore hidden files',
        description: 'Ignore hidden files',
        required: false,
        defaultValue: false,
        }),
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(context) {
        const { store, auth, propsValue } = context;
        return await pollingHelper.test(polling, { store, auth, propsValue });
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },

    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },

    async run(context) {
        const { store, auth, propsValue } = context;
        return await pollingHelper.poll(polling, { store, auth, propsValue });
    },
});