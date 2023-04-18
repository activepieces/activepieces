import { DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper  } from "@activepieces/pieces-common";
import { createTrigger, OAuth2PropertyValue, TriggerStrategy} from '@activepieces/pieces-framework';
import dayjs from "dayjs";
import { googleFormsCommon } from '../common/common';

export const newResponse = createTrigger({
    name: 'new_response',
    displayName: 'New Response',
    description: 'Triggers when there is new response',
    props: {
        authentication: googleFormsCommon.authentication,
        form_id: googleFormsCommon.form_id
    },
    sampleData: {
        "responseId": "ACYDBNhZI4SENjOwT4QIcXOhgco3JhuLftjpLspxETYljVZofOWuqH7bxKQqJWDwGw2IFqE",
        "createTime": "2023-04-01T03:19:28.889Z",
        "lastSubmittedTime": "2023-04-01T03:19:28.889881Z",
        "answers": {
            "5bdc4001": {
                "questionId": "5bdc4001",
                "textAnswers": {
                    "answers": [
                        {
                            "value": "test"
                        }
                    ]
                }
            },
            "283d759e": {
                "questionId": "283d759e",
                "textAnswers": {
                    "answers": [
                        {
                            "value": "نعم"
                        }
                    ]
                }
            },
            "46f3e9cf": {
                "questionId": "46f3e9cf",
                "textAnswers": {
                    "answers": [
                        {
                            "value": "test"
                        }
                    ]
                }
            }
        }
    },
    type: TriggerStrategy.POLLING,
    async test(ctx) {
        return await pollingHelper.test(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    }
});


const polling: Polling<{ authentication: OAuth2PropertyValue, form_id: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        const items = await getResponse(propsValue.authentication, propsValue.form_id, lastFetchEpochMS === 0 ? null : dayjs(lastFetchEpochMS).toISOString());
        return items.map((item) => ({
            epochMilliSeconds: dayjs(item.lastSubmittedTime).valueOf(),
            data: item,
        }));
    }
}

const getResponse = async (authentication: OAuth2PropertyValue, form_id: string, startDate: string | null) => {
    let filter = {};
    if (startDate) {
        filter = {
            'filter': 'timestamp > ' + startDate,
        }
    }
    const response = await httpClient.sendRequest<{ responses: { lastSubmittedTime: string }[] }>({
        url: `https://forms.googleapis.com/v1/forms/${form_id}/responses`,
        method: HttpMethod.GET,
        headers: {
            Authorization: `Bearer ${authentication.access_token}`,
        },
        queryParams: filter
    })
    return response.body['responses'];
}

