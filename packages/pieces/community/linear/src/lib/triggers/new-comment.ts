import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { props } from '../common/props';

export const linearNewComment = createTrigger({
  auth: linearAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a Linear issue',
  props: {
    team_ids: props.team_ids(false),
    author_ids: props.author_ids(false),
  },
  sampleData: {
    id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    body: 'This is a test comment',
    issueId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    parentId: null,
    userId: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
    reactionData: [],
    createdAt: '2023-09-05T12:00:00.000Z',
    updatedAt: '2023-09-05T12:00:00.000Z',
    user: {
      id: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Test user',
    },
    issue: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'Test issue',
      identifier: 'TEST-1',
      team: {
        id: 't1a2b3c4-d5e6-7890-abcd-ef1234567890',
        key: 'TEST',
        name: 'Test team',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = makeClient(context.auth);

    const webhook = await client.createWebhook({
      label: 'ActivePieces New Comment',
      url: context.webhookUrl,
      resourceTypes: ['Comment'],
      allPublicTeams: true,
    });

    if (webhook.success && webhook.webhook) {
      await context.store?.put<WebhookInformation>('_new_comment_trigger', {
        webhookId: (await webhook.webhook).id,
      });
    } else {
      console.error('Failed to create the webhook');
    }
  },
  async onDisable(context) {
    const client = makeClient(context.auth);
    const response =
      await context.store?.get<WebhookInformation>('_new_comment_trigger');
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as {
      action: string;
      data: {
        userId?: string;
        issue?: { team?: { id?: string } };
        [key: string]: unknown;
      };
    };

    if (body.action !== 'create') {
      return [];
    }

    const teamIds = context.propsValue['team_ids'] as string[] | undefined;
    if (teamIds && teamIds.length > 0) {
      const commentTeamId = body.data?.issue?.team?.id;
      if (!commentTeamId || !teamIds.includes(commentTeamId)) {
        return [];
      }
    }

    const authorIds = context.propsValue['author_ids'] as string[] | undefined;
    if (authorIds && authorIds.length > 0) {
      const commentAuthorId = body.data?.userId;
      if (!commentAuthorId || !authorIds.includes(commentAuthorId)) {
        return [];
      }
    }

    return [body.data];
  },
});

interface WebhookInformation {
  webhookId: string;
}
