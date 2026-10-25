import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  Action,
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
  InputPropertyMap,
  PropertyType,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { clickupAuth } from '../src/lib/auth';
import { clickupCommon } from '../src/lib/common';
import { clickupUpdateChecklistItem } from '../src/lib/actions/checklists/update-checklist-item';
import { clickupUpdateComment } from '../src/lib/actions/comments/clickup-update-comment';
import { clickupUpdateSpace } from '../src/lib/actions/spaces/ai-update-space';
import { clickupUpdateTimeEntry } from '../src/lib/actions/time-tracking/update-time-entry';

const AUTH: AppConnectionValueForAuthProperty<typeof clickupAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'test-token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://app.clickup.com/api/v2/oauth/token',
  data: {},
};

let requests: HttpRequest[] = [];
let currentMultipleAssignees = true;

beforeEach(() => {
  requests = [];
  currentMultipleAssignees = true;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    requests.push(request);
    return {
      status: 200,
      headers: {},
      body: { multiple_assignees: currentMultipleAssignees },
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('optionalBooleanValue', () => {
  it.each([true, 'yes', ' Yes ', 'TRUE', 'true'])(
    'reads %j as true',
    (value) => {
      expect(clickupCommon.optionalBooleanValue(value)).toBe(true);
    }
  );

  it.each([false, 'no', 'NO', ' False '])('reads %j as false', (value) => {
    expect(clickupCommon.optionalBooleanValue(value)).toBe(false);
  });

  it.each([undefined, null, '', 'unchanged', 'maybe', 1])(
    'reads %j as leave unchanged',
    (value) => {
      expect(clickupCommon.optionalBooleanValue(value)).toBeUndefined();
    }
  );
});

describe('agent-facing boolean props', () => {
  it.each([
    [clickupUpdateChecklistItem.props.resolved],
    [clickupUpdateComment.props.resolved],
    [clickupUpdateSpace.props.multiple_assignees],
    [clickupUpdateTimeEntry.props.billable],
  ])('%# is an optional Yes / No / Leave unchanged dropdown', (prop) => {
    expect(prop.type).toBe(PropertyType.STATIC_DROPDOWN);
    expect(prop.required).toBe(false);
    expect(prop.options.options.map((option) => option.value)).toEqual([
      'yes',
      'no',
      'unchanged',
    ]);
  });
});

describe('Update Checklist Item', () => {
  const base = {
    checklist_id: 'cl1',
    checklist_item_id: 'it1',
    name: 'Renamed',
    assignee: undefined,
    parent: undefined,
  };

  it.each([undefined, 'unchanged', 'maybe'])(
    'leaves resolved out of the request for %j',
    async (resolved) => {
      await run({
        action: clickupUpdateChecklistItem,
        propsValue: { ...base, resolved },
      });
      expect(requests).toHaveLength(1);
      expect(requests[0].body).toEqual({ name: 'Renamed' });
    }
  );

  it.each([
    ['yes', true],
    ['no', false],
  ])('sends resolved for %j', async (resolved, expected) => {
    await run({
      action: clickupUpdateChecklistItem,
      propsValue: { ...base, resolved },
    });
    expect(requests[0].body).toEqual({ name: 'Renamed', resolved: expected });
  });
});

describe('Update Comment', () => {
  const base = {
    comment_id: 'c1',
    comment_text: 'Edited',
    assignee: undefined,
  };

  it.each([undefined, 'unchanged'])(
    'leaves resolved out of the request for %j',
    async (resolved) => {
      await run({
        action: clickupUpdateComment,
        propsValue: { ...base, resolved },
      });
      expect(requests[0].body).toEqual({ comment_text: 'Edited' });
    }
  );

  it.each([
    ['yes', true],
    ['no', false],
  ])('sends resolved for %j', async (resolved, expected) => {
    await run({
      action: clickupUpdateComment,
      propsValue: { ...base, resolved },
    });
    expect(requests[0].body).toEqual({
      comment_text: 'Edited',
      resolved: expected,
    });
  });
});

describe('Update Time Entry', () => {
  const base = {
    workspace_id: 'w1',
    timer_id: 't1',
    description: 'Edited',
    start: undefined,
    duration: undefined,
  };

  it.each([undefined, 'unchanged'])(
    'leaves billable out of the request for %j',
    async (billable) => {
      await run({
        action: clickupUpdateTimeEntry,
        propsValue: { ...base, billable },
      });
      expect(requests[0].body).toEqual({ description: 'Edited' });
    }
  );

  it.each([
    ['yes', true],
    ['no', false],
    [' True ', true],
  ])('sends billable for %j', async (billable, expected) => {
    await run({
      action: clickupUpdateTimeEntry,
      propsValue: { ...base, billable },
    });
    expect(requests[0].body).toEqual({
      description: 'Edited',
      billable: expected,
    });
  });
});

describe('Update Space', () => {
  const base = { workspace_id: 'w1', space_id: 's1', name: 'Renamed' };

  it.each([
    [undefined, true],
    ['unchanged', true],
    [undefined, false],
    ['unchanged', false],
  ])(
    'reads the current setting and sends it back for %j (current %j)',
    async (multiple_assignees, current) => {
      currentMultipleAssignees = current;
      await run({
        action: clickupUpdateSpace,
        propsValue: { ...base, multiple_assignees },
      });
      expect(requests.map((request) => request.method)).toEqual([
        HttpMethod.GET,
        HttpMethod.PUT,
      ]);
      expect(requests[0].url).toBe('https://api.clickup.com/api/v2/space/s1');
      expect(requests[1].body).toEqual({
        name: 'Renamed',
        multiple_assignees: current,
      });
    }
  );

  it.each([
    ['yes', true],
    ['no', false],
  ])(
    'sends %j without reading the space first',
    async (multiple_assignees, expected) => {
      await run({
        action: clickupUpdateSpace,
        propsValue: { ...base, multiple_assignees },
      });
      expect(requests.map((request) => request.method)).toEqual([
        HttpMethod.PUT,
      ]);
      expect(requests[0].body).toEqual({
        name: 'Renamed',
        multiple_assignees: expected,
      });
    }
  );
});

function run<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: Action<typeof clickupAuth, Props>;
  propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
  return action.run({
    ...createMockActionContext<Props>({ propsValue }),
    auth: AUTH,
  });
}
