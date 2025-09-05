import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';

export const createSource = createAction({
  auth: DocsBotAuth,
  name: 'createSource',
  displayName: 'Create Source',
  description: 'Create a new source for a bot.',
  props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    type: Property.StaticDropdown({
      displayName: "Source Type",
      required: true,
      options: {
        options: [
          { label: "URL", value: "url" },
          { label: "Document", value: "document" },
          { label: "Sitemap", value: "sitemap" },
          { label: "WordPress (wp)", value: "wp" },
          { label: "URLs (bulk)", value: "urls" },
          { label: "CSV", value: "csv" },
          { label: "RSS Feed", value: "rss" },
          { label: "Q&A", value: "qa" },
          { label: "YouTube", value: "youtube" },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: "Title",
      description: "Source title (required for document type).",
      required: false,
    }),
    url: Property.ShortText({
      displayName: "Source URL",
      description:
        "Required for url, sitemap, youtube, and rss types. Optional otherwise.",
      required: false,
    }),
    file: Property.ShortText({
      displayName: "File Path",
      description:
        "Required for urls, csv, document, or wp types. Usually the cloud storage path returned by GET /upload-url.",
      required: true,
    }),
    faqs: Property.Json({
      displayName: "FAQs",
      description:
        'Required if type is qa. Example: [{"question": "What is X?", "answer": "X is ..."}]',
      required: false,
    }),
    scheduleInterval: Property.StaticDropdown({
      displayName: "Schedule Interval",
      required: false,
      options: {
        options: [
          { label: "None", value: "none" },
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
        ],
      },
    }),
  },

  async run({ propsValue, auth }) {
    const { teamId, botId, type, title, url, file, faqs, scheduleInterval } =
      propsValue;

    const body: Record<string, any> = {
      type,
    };

    if (title) body['title'] = title;
    if (url) body['url'] = url;
    if (file) body['file'] = file;
    if (faqs) body['faqs'] = faqs;
    if (scheduleInterval) body['scheduleInterval'] = scheduleInterval;

    const request = {
      method: HttpMethod.POST,
      url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/sources`,
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
      body,
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
