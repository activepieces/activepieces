import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof lokaliseAuth>,
  { projectId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const translations = (await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/projects/${propsValue.projectId}/translations`
    )) as any;

    return translations.translations
      .filter(
        (translation: { modified_at_timestamp: number }) =>
          translation.modified_at_timestamp * 1000 > lastFetchEpochMS
      )
      .map((translation: any) => ({
        epochMilliSeconds: translation.modified_at_timestamp * 1000,
        data: translation,
      }));
  },
};

export const translationUpdated = createTrigger({
  auth: lokaliseAuth,
  name: 'translationUpdated',
  displayName: 'Translation Updated',
  description: 'Trigger when a translation is updated in your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
