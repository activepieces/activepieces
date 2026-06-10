import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { googleFormsCommon, googleFormsAuth, getAccessToken, GoogleFormsAuthValue } from '../common/common';

export const newOrUpdatedResponse = createTrigger({
  auth: googleFormsAuth,
  name: 'new_or_updated_response',
  displayName: 'New or Updated Response',
  description: 'Triggers when a response is submitted or edited (matches Google Forms\' lastSubmittedTime).',
  props: {
    form_id: googleFormsCommon.form_id,
    include_team_drives: googleFormsCommon.include_team_drives,
  },
  sampleData: {
    responseId: 'ACYDBNhZI4SENjOwT4QIcXOhgco3JhuLftjpLspxETYljVZofOWuqH7bxKQqJWDwGw2IFqE',
    createTime: '2025-01-15T03:19:28.889Z',
    lastSubmittedTime: '2025-01-16T10:42:01.123Z',
    answers: {
      '5bdc4001': {
        questionId: '5bdc4001',
        textAnswers: { answers: [{ value: 'updated answer' }] },
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

const polling: Polling<AppConnectionValueForAuthProperty<typeof googleFormsAuth>, { form_id: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await listAllResponses(auth, propsValue.form_id);

    return items
      .sort(
        (a, b) =>
          new Date(b.lastSubmittedTime).getTime() -
          new Date(a.lastSubmittedTime).getTime()
      )
      .map((item) => ({
        id: `${item.responseId}:${item.lastSubmittedTime}`,
        data: item,
      }));
  },
};

const listAllResponses = async (
  authentication: GoogleFormsAuthValue,
  form_id: string
): Promise<Array<{ responseId: string; lastSubmittedTime: string }>> => {
  const accessToken = await getAccessToken(authentication);
  const collected: Array<{ responseId: string; lastSubmittedTime: string }> = [];
  let pageToken: string | undefined = undefined;
  do {
    const queryParams: Record<string, string> = { pageSize: '1000' };
    if (pageToken) queryParams['pageToken'] = pageToken;
    const response = await httpClient.sendRequest<{
      responses?: { responseId: string; lastSubmittedTime: string }[];
      nextPageToken?: string;
    }>({
      url: `https://forms.googleapis.com/v1/forms/${form_id}/responses`,
      method: HttpMethod.GET,
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
    });
    const batch = Array.isArray(response.body.responses) ? response.body.responses : [];
    for (const item of batch) collected.push(item);
    pageToken = response.body.nextPageToken;
  } while (pageToken);
  return collected;
};
