import { mailchimpOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpApi } from '../common/client';

export const findSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'find_subscriber',
  classification: 'READ',
  displayName: 'Find Subscriber',
  description: 'Search for subscribers across all lists or within a specific list. This action provides comprehensive subscriber information including merge fields, interests, and activity data.',
  audience: 'human',
  aiMetadata: { description: 'Looks up a subscriber by exact email, returning merge fields, interests, and activity data: when an audience (list) is specified it checks that one list, and when left empty it searches every list in the account. Use to find a contact and inspect their profile or status. Requires the email; read-only and idempotent.', idempotent: true },
  outputSchema: mailchimpOutputSchemas['findSubscriber'],
  props: {
    list_id: mailchimpCommon.mailChimpOptionalListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to search for',
      required: true,
    }),
    include_fields: Property.Array({
      displayName: 'Include Fields',
      description: 'Fields to include in the response (leave empty for all fields). Use dot notation for nested fields (e.g., "merge_fields.FNAME")',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description: 'Fields to exclude from the response. Use dot notation for nested fields',
      required: false,
    }),
  },
  async run(context) {
    const searchEmail = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email Address' });
    const listId = mailchimpApi.optionalText(context.propsValue.list_id);
    const fields = mailchimpApi.toStringList(context.propsValue.include_fields);
    const excludeFields = mailchimpApi.toStringList(context.propsValue.exclude_fields);
    const queryParams = {
      fields: fields.length > 0 ? fields.join(',') : undefined,
      exclude_fields: excludeFields.length > 0 ? excludeFields.join(',') : undefined,
    };
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const subscriberHash = mailchimpCommon.getMD5EmailHash(searchEmail.trim());

    const fetchMember = (id: string) =>
      client.requestOrNotFound<SubscriberRecord>({
        method: HttpMethod.GET,
        path: `/lists/${encodeURIComponent(id)}/members/${subscriberHash}`,
        queryParams,
        operation: 'find subscriber',
      });

    if (listId !== undefined) {
      const subscriber = await fetchMember(listId);
      if (subscriber === null) {
        await client.request<unknown>({
          method: HttpMethod.GET,
          path: `/lists/${encodeURIComponent(listId)}`,
          queryParams: { fields: 'id' },
          operation: 'find subscriber (audience lookup)',
        });
        return notFound({ searchEmail, scope: `List: ${listId}`, summaryScope: `Limited to list: ${listId}`, listsSearched: 1 });
      }
      const record = toRecord({ subscriber, listName: null });
      return found({ searchEmail, scope: `List: ${listId}`, summaryScope: `Limited to list: ${listId}`, records: [record], listsSearched: 1 });
    }

    const lists = await client.listAll<{ id: string; name: string }>({
      path: '/lists',
      itemsKey: 'lists',
      queryParams: { fields: 'lists.id,lists.name,total_items' },
      operation: 'find subscriber (list audiences)',
    });
    const records: SubscriberOutput[] = [];
    for (let index = 0; index < lists.length; index += CONCURRENCY) {
      const batch = lists.slice(index, index + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (list) => {
          const subscriber = await fetchMember(list.id);
          return subscriber === null ? null : toRecord({ subscriber, listName: list.name });
        })
      );
      for (const result of results) {
        if (result !== null) {
          records.push(result);
        }
      }
    }
    if (records.length === 0) {
      return notFound({ searchEmail, scope: 'All Lists', summaryScope: 'Searched across all lists', listsSearched: lists.length });
    }
    return found({ searchEmail, scope: 'All Lists', summaryScope: 'Searched across all lists', records, listsSearched: lists.length });
  },
});

function toRecord({ subscriber, listName }: { subscriber: SubscriberRecord; listName: string | null }): SubscriberOutput {
  return { ...subscriber, list_name: listName };
}

function mergeText({ record, key }: { record: SubscriberOutput; key: string }): string | null {
  const value = record.merge_fields?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toIso(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function found({
  searchEmail,
  scope,
  summaryScope,
  records,
  listsSearched,
}: {
  searchEmail: string;
  scope: string;
  summaryScope: string;
  records: SubscriberOutput[];
  listsSearched: number;
}) {
  const primary = records[0];
  const firstName = mergeText({ record: primary, key: 'FNAME' });
  const lastName = mergeText({ record: primary, key: 'LNAME' });
  const fullName = [firstName, lastName].filter((part) => part !== null).join(' ');
  return {
    success: true,
    found: true,
    match_type: 'exact',
    search_query: searchEmail,
    search_scope: scope,
    total_matches: records.length,
    subscribers: records,
    primary_subscriber: {
      id: primary.id,
      email_address: primary.email_address,
      status: primary.status,
      list_id: primary.list_id,
      list_name: primary.list_name,
      full_name: fullName.length > 0 ? fullName : null,
      company: mergeText({ record: primary, key: 'COMPANY' }),
      phone: mergeText({ record: primary, key: 'PHONE' }),
      member_since: toIso(primary.timestamp_signup),
      last_activity: toIso(primary.last_changed),
      member_rating: primary.member_rating ?? null,
      vip_status: primary.vip ? 'VIP' : 'Standard',
      email_type: primary.email_type ?? null,
      language: primary.language || null,
    },
    search_summary: {
      query: searchEmail,
      scope: summaryScope,
      exact_matches: records.length,
      partial_matches: 0,
      total_results: records.length,
      lists_searched: listsSearched,
    },
  };
}

function notFound({
  searchEmail,
  scope,
  summaryScope,
  listsSearched,
}: {
  searchEmail: string;
  scope: string;
  summaryScope: string;
  listsSearched: number;
}) {
  return {
    success: true,
    found: false,
    match_type: 'none',
    search_query: searchEmail,
    search_scope: scope,
    total_matches: 0,
    subscribers: [],
    message: `No subscriber found with the email "${searchEmail}"`,
    search_summary: {
      query: searchEmail,
      scope: summaryScope,
      exact_matches: 0,
      partial_matches: 0,
      total_results: 0,
      lists_searched: listsSearched,
    },
  };
}

const CONCURRENCY = 5;

type SubscriberRecord = {
  id: string;
  email_address: string;
  status: string;
  list_id: string;
  email_type?: string;
  merge_fields?: Record<string, unknown>;
  timestamp_signup?: string;
  last_changed?: string;
  member_rating?: number;
  vip?: boolean;
  language?: string;
};

type SubscriberOutput = SubscriberRecord & { list_name: string | null };
