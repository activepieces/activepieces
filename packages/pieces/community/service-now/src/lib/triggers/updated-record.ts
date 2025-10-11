import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, pollingHelper, Polling } from "@activepieces/pieces-common";
import { serviceNowAuth, ServiceNowAuth } from "../common/auth";
import { serviceNowProps } from "../common/props";
import { ServiceNowClient } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc);


type TriggerProps = {
    table_name: string | undefined;
}

export const updatedRecordTrigger = createTrigger({
    auth: serviceNowAuth,
    name: 'updated_record',
    displayName: 'Updated Record',
    description: 'Triggers when a record is updated in a specified ServiceNow table.',
    props: {
        table_name: serviceNowProps.table_name(),
    },
    sampleData: {
        "sys_id": "a9e30c7dc61122760116894de7bcc7bd",
        "number": "INC0000046",
        "state": "2", // Example: state changed
        "short_description": "User cannot log in",
        "sys_updated_on": "2025-10-11 12:05:00",
        "sys_created_on": "2025-10-11 12:00:00"
    },
    type: TriggerStrategy.POLLING,

    async test(ctx) {
        return await pollingHelper.test(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
            files: ctx.files,
        });
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
        });
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
        });
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, {
            auth: ctx.auth,
            store: ctx.store,
            propsValue: ctx.propsValue,
            files: ctx.files,
        });
    },
});

const polling: Polling<ServiceNowAuth, TriggerProps> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { table_name } = propsValue;
        if (!table_name) {
            return [];
        }

        const client = new ServiceNowClient(auth);

        const startDate = lastFetchEpochMS === 0
            ? dayjs().subtract(5, 'minute')
            : dayjs(lastFetchEpochMS);

        const formattedDate = startDate.utc().format('YYYY-MM-DD HH:mm:ss');
        
        const query = `sys_updated_on>${formattedDate}^ORDERBYsys_updated_on`;
        
        const response = await client.makeRequest<{ result: { sys_updated_on: string }[] }>(
            HttpMethod.GET,
            `/table/${table_name}`,
            undefined,
            {
                sysparm_query: query,
                sysparm_limit: '200'
            }
        );

        const records = response.result;


        return records.map((record) => ({
            epochMilliSeconds: dayjs(record.sys_updated_on).valueOf(),
            data: record,
        }));
    },
};