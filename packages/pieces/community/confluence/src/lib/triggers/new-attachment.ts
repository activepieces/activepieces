import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { confluenceAuth, confluenceAuthValue } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

interface ConfluenceAttachment {
  id: string;
  title: string;
  pageId?: string;
  mediaType: string;
  fileSize: number;
  version: {
    number: number;
    createdAt: string;
  };
  downloadLink?: string;
}

const props = {
  spaceId: spaceIdProp,
  pageId: pageIdProp,
};

const polling: Polling<confluenceAuthValue, { spaceId?: string; pageId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const response = await confluenceApiCall<
      PaginatedResponse<ConfluenceAttachment>
    >({
      domain: auth.props.confluenceDomain,
      username: auth.props.username,
      password: auth.props.password,
      version: 'v2',
      method: HttpMethod.GET,
      resourceUri: `/pages/${propsValue.pageId}/attachments`,
      query: {
        limit: '100',
        sort: '-created-date',
      },
    });

    if (isNil(response.results)) return [];

    return response.results
      .filter((a) => a.version.number === 1)
      .map((attachment) => ({
        epochMilliSeconds: new Date(attachment.version.createdAt).getTime(),
        data: attachment,
      }));
  },
};

export const newAttachmentTrigger = createTrigger({
  name: 'new-attachment',
  displayName: 'New Attachment',
  description:
    'Triggers when a new attachment is uploaded to the selected page.',
  auth: confluenceAuth,
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    id: 'att-1234',
    title: 'design.png',
    pageId: '987654321',
    mediaType: 'image/png',
    fileSize: 51200,
    version: {
      number: 1,
      createdAt: '2024-01-02T10:00:00.000Z',
      authorId: '12345678abcd',
      message: '',
      minorEdit: false,
    },
    downloadLink: '/download/attachments/987654321/design.png',
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
