import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { docsbotCommon } from '../common/dropdown';
import { HttpMethod } from '@activepieces/pieces-common';
import { httpClient, HttpHeader } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createSource = createAction({
  auth: DocsBotAuth,
  name: 'create_source',
  displayName: 'Create Source',
  description: 'Create a new source for a bot.',
  props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Document', value: 'document' },
          { label: 'Sitemap', value: 'sitemap' },
          { label: 'WordPress', value: 'wp' },
          { label: 'URLs', value: 'urls' },
          { label: 'CSV', value: 'csv' },
          { label: 'RSS', value: 'rss' },
          { label: 'Q&A', value: 'qa' },
          { label: 'YouTube', value: 'youtube' },
        ]
      }
    }),
    dynamicProps: Property.DynamicProperties({
      displayName: "Source Properties",
      required: true,
      refreshers: ["type"],
      props: async ({ type }) => {
        const fields: DynamicPropsValue = {};
        const sourceType = typeof type === 'string' ? type : undefined;

        if (!sourceType) return fields;

        if (sourceType === 'document') {
          fields['title'] = Property.ShortText({
            displayName: 'Title',
            required: true,
          });
        }

        if (['url', 'sitemap', 'youtube', 'rss'].includes(sourceType)) {
          fields['url'] = Property.ShortText({
            displayName: 'URL',
            required: true,
          });
        }

        if (['urls', 'csv', 'document', 'wp'].includes(sourceType)) {
          fields['file_content'] = Property.File({
            displayName: 'File Content',
            required: true,
          });
          fields['file_name'] = Property.ShortText({
            displayName: 'File Name',
            description: 'The name of the file with extension (e.g., my_data.csv)',
            required: true,
          });
        }

        if (sourceType === 'qa') {
          fields['faqs'] = Property.Json({
            displayName: 'FAQs',
            description: 'An array of question/answer objects. e.g., [{"question":"Question text", "answer":"The answer."}]',
            required: true,
          });
        }

        return fields;
      }
    }),
    scheduleInterval: Property.StaticDropdown({
      displayName: 'Schedule Interval',
      required: false,
      description: 'The source refresh scheduled interval. Defaults to none.',
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
        ]
      }
    }),
  },

  async run(context) {
    const { teamId, botId, type, scheduleInterval } = context.propsValue;
    const { title, url, faqs, file_content, file_name } = context.propsValue.dynamicProps;

    let filePath: string | undefined = undefined;

    const fileBasedTypes = ['urls', 'csv', 'document', 'wp'];
    if (fileBasedTypes.includes(type) && file_content && file_name) {

      const uploadUrlResponse = await makeRequest(
        context.auth,
        HttpMethod.GET,
        `/api/teams/${teamId}/bots/${botId}/upload-url`,
        { fileName: file_name }
      );


      const presignedUrl = uploadUrlResponse.url as string;
      filePath = uploadUrlResponse.file as string;

      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: presignedUrl,
        body: Buffer.from(file_content.data, 'base64'),
        headers: {
          [HttpHeader.CONTENT_TYPE]: 'application/octet-stream',
        },
      });
    }

    const createSourceBody: Record<string, unknown> = { type };
    if (title) createSourceBody['title'] = title;
    if (url) createSourceBody['url'] = url;
    if (filePath) createSourceBody['file'] = filePath;
    if (faqs) createSourceBody['faqs'] = faqs;
    if (scheduleInterval) createSourceBody['scheduleInterval'] = scheduleInterval;

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/api/teams/${teamId}/bots/${botId}/sources`,
      undefined,
      createSourceBody
    );
    return response;
  },
});
