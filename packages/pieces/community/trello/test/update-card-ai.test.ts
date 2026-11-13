import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { updateCardAi } from '../src/lib/actions/ai/update-card-ai';
import { PropertyType } from '@activepieces/pieces-framework';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: { sendRequest: vi.fn() },
  };
});

vi.mock('../src/index', async () => {
  const { PieceAuth } = await import('@activepieces/pieces-framework');
  return {
    trelloAuth: PieceAuth.BasicAuth({
      displayName: 'Trello',
      required: true,
      username: { displayName: 'Key' },
      password: { displayName: 'Token' },
    }),
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

async function runWith(props: Record<string, unknown>) {
  const ctx = {
    auth: { username: 'key', password: 'token' },
    propsValue: { card_id: 'c1', ...props },
  };
  await Reflect.apply(updateCardAi.run, updateCardAi, [ctx]);
  return sendRequest.mock.calls[0][0].body;
}

describe('update_card_ai closed tri-state', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: { id: 'c1' },
    });
  });

  it.each([
    ['yes', true],
    ['no', false],
    ['true', true],
    ['false', false],
    [true, true],
    [false, false],
  ])('sends closed=%s as %s', async (input, expected) => {
    expect(await runWith({ closed: input })).toEqual({ closed: expected });
  });

  it.each([['unchanged'], [undefined], [null], ['']])(
    'omits closed for %s',
    async (input) => {
      expect(await runWith({ closed: input })).toEqual({});
    }
  );

  it('renaming does not touch the archived state', async () => {
    expect(await runWith({ name: 'New name' })).toEqual({ name: 'New name' });
  });
});

describe('update_card_ai labels', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: { id: 'c1' },
    });
  });

  it.each([[[]], [undefined], [null]])(
    'leaves the card labels alone for %j',
    async (input) => {
      expect(await runWith({ name: 'New name', labels: input })).toEqual({
        name: 'New name',
      });
    }
  );

  it('replaces the label set when label ids are given', async () => {
    expect(await runWith({ labels: ['l1', 'l2'] })).toEqual({
      idLabels: ['l1', 'l2'],
    });
  });
});

describe('update_card_ai closed prop shape', () => {
  it('keeps Archived as an optional tri-state StaticDropdown', () => {
    const closed = updateCardAi.props.closed;
    expect(closed.type).toBe(PropertyType.STATIC_DROPDOWN);
    expect(closed.required).toBe(false);
    const values = closed.options.options.map((o) => o.value);
    expect(values).toEqual(['yes', 'no', 'unchanged']);
  });
});
