import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostClient, ghostCommon } from '../../common/client';
import { ghostListMemberActivityOutputSchema } from '../../output-schemas';

type MemberEvent = {
  type: string;
  data: Record<string, unknown> & {
    id?: string;
    member_id?: string;
    created_at?: string;
    member?: { id?: string; name?: string | null; email?: string };
  };
};

export const ghostListMemberActivity = createAction({
  auth: ghostAuth,
  name: 'ghost_list_member_activity',
  outputSchema: ghostListMemberActivityOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Member Activity',
  description: 'List member activity events such as signups, logins, newsletter changes, email opens and payments.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the newest member activity events, newest first: signups, logins, newsletter subscribe/unsubscribe, email deliveries, opens and clicks, comments, feedback, donations, email address changes and paid subscription changes. Give a Member ID for one member\'s timeline, an Event Type to narrow it, or an NQL filter for anything else. Page back by filtering on data.created_at older than the last event returned.',
    idempotent: true,
  },
  props: {
    memberId: Property.ShortText({
      displayName: 'Member ID',
      description: 'Only return events for this member. Get the ID from List Members or Get Member by Email.',
      required: false,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Only return this kind of event.',
      required: false,
      options: {
        options: [
          { label: 'Signup', value: 'signup_event' },
          { label: 'Login', value: 'login_event' },
          { label: 'Newsletter subscribe or unsubscribe', value: 'newsletter_event' },
          { label: 'Email delivered', value: 'email_delivered_event' },
          { label: 'Email opened', value: 'email_opened_event' },
          { label: 'Email link clicked', value: 'click_event' },
          { label: 'Email failed', value: 'email_failed_event' },
          { label: 'Comment', value: 'comment_event' },
          { label: 'Feedback', value: 'feedback_event' },
          { label: 'Paid subscription change', value: 'subscription_event' },
          { label: 'Payment', value: 'payment_event' },
          { label: 'Email address change', value: 'email_change_event' },
          { label: 'Donation', value: 'donation_event' },
        ],
      },
    }),
    filter: ghostProps.filter("data.created_at:<'2026-01-01 00:00:00'"),
    limit: ghostProps.limit,
  },
  async run(context) {
    const { memberId, eventType, filter, limit } = context.propsValue;
    const parts: string[] = [];
    if (ghostCommon.hasText(memberId)) {
      parts.push(`data.member_id:${ghostCommon.nqlString(memberId.trim())}`);
    }
    if (ghostCommon.hasText(eventType)) {
      parts.push(`type:${eventType}`);
    }
    if (ghostCommon.hasText(filter)) {
      parts.push(`(${filter.trim()})`);
    }
    const response = await ghostClient.request<{ events?: MemberEvent[]; meta?: unknown }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/members/events',
      query: {
        filter: parts.length > 0 ? parts.join('+') : undefined,
        limit: ghostCommon.listQuery({ limit })['limit'],
      },
    });
    const events = (response.events ?? []).map((event) => {
      const { member, ...data } = event.data ?? {};
      return {
        type: event.type,
        id: data.id ?? null,
        created_at: data.created_at ?? null,
        member_id: data.member_id ?? member?.id ?? null,
        member_name: member?.name ?? null,
        member_email: member?.email ?? null,
        data,
      };
    });
    return {
      events,
      count: events.length,
      total: ghostCommon.pagination(response.meta).total,
    };
  },
});
