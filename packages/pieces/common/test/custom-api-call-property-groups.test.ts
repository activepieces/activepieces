/// <reference types="vitest/globals" />

import { Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '../src';

function buildAction() {
  return createCustomApiCallAction({
    baseUrl: () => 'https://api.example.com/v1',
    authMapping: async () => ({ 'x-api-key': 'secret' }),
    extraProps: {
      region: Property.ShortText({ displayName: 'Region', required: false }),
    },
  });
}

describe('createCustomApiCallAction property groups', () => {
  it('lays out the request and the payload as section cards', () => {
    const groups = buildAction().propertyGroups ?? [];

    expect(groups.map(({ key, display, label, icon, props }) => ({ key, display, label, icon, props }))).toEqual([
      { key: 'request', display: 'section', label: 'Request', icon: 'send', props: ['method', 'url', 'headers', 'queryParams'] },
      { key: 'payload', display: 'section', label: 'Data to send', icon: 'code', props: ['body_type', 'body'] },
    ]);
  });

  it('only groups props the action defines', () => {
    const action = buildAction();
    const grouped = (action.propertyGroups ?? []).flatMap((group) => group.props);

    expect(grouped.filter((name) => !(name in action.props))).toEqual([]);
  });

  it('keeps the advanced options and extra props outside the cards', () => {
    const grouped = new Set((buildAction().propertyGroups ?? []).flatMap((group) => group.props));

    expect(['response_is_binary', 'failsafe', 'timeout', 'followRedirects', 'region'].filter((name) => grouped.has(name))).toEqual([]);
  });
});
