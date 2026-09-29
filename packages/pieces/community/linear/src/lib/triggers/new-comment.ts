import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { linearWebhook } from '../common/webhook';
import { commentWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { props } from '../common/props';

export const linearNewComment = createTrigger({
  auth: linearAuth,
  name: 'new_comment',
  classification: 'READ',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a Linear issue. Only issues in public teams are covered.',
  aiMetadata: {
    description: 'Fires when a new comment is posted on a Linear issue, optionally filtered to specific teams or comment authors. Represents the created comment and its parent issue. Only public teams are covered: events in private teams do not fire it.',
  },
  props: {
    team_ids: props.team_ids(false),
    author_ids: props.author_ids(false),
  },
  sampleData: linearWebhookSamples.newCommentSample,
  outputSchema: commentWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_new_comment_trigger',
      input: {
        label: 'ActivePieces New Comment',
        url: context.webhookUrl,
        resourceTypes: ['Comment'],
        allPublicTeams: true,
      },
    });
  },
  async onDisable(context) {
    await linearWebhook.unregister({
      auth: context.auth,
      store: context.store,
      storeKey: '_new_comment_trigger',
    });
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

    return [body];
  },
});
