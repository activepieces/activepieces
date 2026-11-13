import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const actionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Action ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'tags', label: 'Tags' },
    {
      key: 'steps',
      label: 'Match Rules',
      listItems: [
        { key: 'event', label: 'Event' },
        { key: 'url', label: 'URL' },
        { key: 'urlMatching', label: 'URL Matching' },
        { key: 'selector', label: 'CSS Selector' },
        { key: 'text', label: 'Element Text' },
        { key: 'href', label: 'Link Href' },
        { key: 'properties', label: 'Property Filters' },
      ],
    },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'createdBy', label: 'Created By (email)', format: 'email' },
    { key: 'lastCalculatedAt', label: 'Last Calculated At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

function mapStep(raw: unknown) {
  const s = posthogClient.recordOf(raw);
  return {
    event: posthogClient.str(s['event']),
    url: posthogClient.str(s['url']),
    urlMatching: posthogClient.str(s['url_matching']),
    selector: posthogClient.str(s['selector']),
    text: posthogClient.str(s['text']),
    href: posthogClient.str(s['href']),
    properties: posthogClient.arrayOf(s['properties']),
  };
}

export const getAction = createAction({
  auth: posthogAuth,
  name: 'get_action',
  classification: 'READ',
  displayName: 'Get Action',
  description: 'Get an action definition and its match rules.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one PostHog action (a saved definition grouping events) by numeric action id from List Actions. Returns name, description, tags, a link and steps: the match rules, any one of which makes an event count, each with event name, url and urlMatching (contains, exact, regex), CSS selector, element text, href and property filters. Read-only.',
    idempotent: true,
  },
  outputSchema: actionOutputSchema,
  props: {
    actionId: Property.ShortText({ displayName: 'Action ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const actionId = posthogClient.numericId({ value: propsValue.actionId, label: 'Action ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['actions', actionId] }),
    });
    const r = posthogClient.recordOf(body);
    const id = posthogClient.num(r['id']);
    return {
      id,
      name: posthogClient.str(r['name']),
      description: posthogClient.str(r['description']),
      tags: posthogClient.arrayOf(r['tags']).filter((t): t is string => typeof t === 'string'),
      steps: posthogClient.arrayOf(r['steps']).map(mapStep),
      createdAt: posthogClient.str(r['created_at']),
      createdBy: posthogClient.str(posthogClient.recordOf(r['created_by'])['email']),
      lastCalculatedAt: posthogClient.str(r['last_calculated_at']),
      url: id === null ? null : posthogMappers.webUrl({ auth: auth.props, path: ['data-management', 'actions', id] }),
    };
  },
});
