import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  OAuth2PropertyValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { googleFormsCommon } from '../common/common';
import { googleFormsAuth } from '../../';

export const newResponse = createTrigger({
  auth: googleFormsAuth,
  name: 'new_response',
  displayName: 'New Response',
  description: 'Triggers when there is new response',
  props: {
    form_id: googleFormsCommon.form_id,
    include_team_drives: googleFormsCommon.include_team_drives,
  },
  sampleData: {
    responseId:
      'ACYDBNhZI4SENjOwT4QIcXOhgco3JhuLftjpLspxETYljVZofOWuqH7bxKQqJWDwGw2IFqE',
    createTime: '2023-04-01T03:19:28.889Z',
    lastSubmittedTime: '2023-04-01T03:19:28.889881Z',
    answers: {
      '5bdc4001': {
        questionId: '5bdc4001',
        textAnswers: {
          answers: [
            {
              value: 'test',
            },
          ],
        },
      },
      '283d759e': {
        questionId: '283d759e',
        textAnswers: {
          answers: [
            {
              value: 'نعم',
            },
          ],
        },
      },
      '46f3e9cf': {
        questionId: '46f3e9cf',
        textAnswers: {
          answers: [
            {
              value: 'test',
            },
          ],
        },
      },
    },
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
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
    return await pollingHelper.poll(polling, ctx);
  },
});

const polling: Polling<OAuth2PropertyValue, { form_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getResponse(
      auth,
      propsValue.form_id,
      lastFetchEpochMS === 0 ? null : dayjs(lastFetchEpochMS).toISOString()
    );

    return items
      .sort(
        (a, b) =>
          new Date(b.lastSubmittedTime).getTime() -
          new Date(a.lastSubmittedTime).getTime()
      )
      .map((item) => ({
        epochMilliSeconds: dayjs(item.lastSubmittedTime).valueOf(),
        data: item,
      }));
  },
};

const getResponse = async (
  authentication: OAuth2PropertyValue,
  form_id: string,
  startDate: string | null
) => {
  let filter = {};
  if (startDate) {
    filter = {
      filter: 'timestamp > ' + startDate,
    };
  }
  const response = await httpClient.sendRequest<{
    responses: { lastSubmittedTime: string }[];
  }>({
    url: `https://forms.googleapis.com/v1/forms/${form_id}/responses`,
    method: HttpMethod.GET,
    headers: {
      Authorization: `Bearer ${authentication.access_token}`,
    },
    queryParams: filter,
  });

  const formResponses = response.body.responses;
  if (formResponses && Array.isArray(formResponses)) {
    return formResponses;
  }
  return [];
};
