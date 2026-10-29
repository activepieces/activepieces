import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { newAttachmentOutputSchema } from '../output-schemas';

const props = {
  spaceId: confluenceProps.spaceId({ required: true }),
  pageId: confluenceProps.pageId({ required: true }),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof confluenceAuth>, { spaceId?: string; pageId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const results = await confluenceApi.listPageAttachments({
      auth,
      pageId: propsValue.pageId,
      sort: '-created-date',
    });

    return results
      .filter((a) => a.version.number === 1)
      .map((attachment) => ({
        epochMilliSeconds: new Date(attachment.version.createdAt).getTime(),
        data: attachment,
      }));
  },
};

export const newAttachmentTrigger = createTrigger({
  name: 'new-attachment',
  outputSchema: newAttachmentOutputSchema,
  classification: 'READ',
  displayName: 'New Attachment',
  description:
    'Triggers when a new attachment is uploaded to the selected page.',
  aiMetadata: {
    description: 'Fires when a new attachment is uploaded to the selected Confluence page. Each event represents one newly added attachment (first version); new versions of an existing attachment do not fire this.',
  },
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
