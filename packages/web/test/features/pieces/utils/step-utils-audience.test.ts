/**
 * @vitest-environment jsdom
 */
import { LocalesEnum } from '@activepieces/core-utils';
import { FlowActionType } from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('i18next', () => ({ t: (k: string) => k }));
vi.mock('@/features/pieces/api/pieces-api', () => ({ piecesApi: { get } }));

import { stepUtils } from '@/features/pieces/utils/step-utils';

const AI_ACTION = 'slack_search_messages';

const pieceWith = (actions: Record<string, unknown>) => ({
  name: 'slack',
  displayName: 'Slack',
  version: '0.18.0',
  logoUrl: 'logo.png',
  actions,
  triggers: {},
  auth: undefined,
  categories: [],
});

const humanFilteredSlack = () =>
  pieceWith({
    slack_send_message: { displayName: 'Send Message', description: 'd' },
  });

const unfilteredSlack = () =>
  pieceWith({
    slack_send_message: { displayName: 'Send Message', description: 'd' },
    [AI_ACTION]: {
      displayName: 'Search messages',
      description: 'Search Slack',
    },
  });

const step = {
  name: 'step_1',
  type: FlowActionType.PIECE,
  displayName: 'Search messages',
  valid: true,
  settings: {
    pieceName: 'slack',
    pieceVersion: '0.18.0',
    actionName: AI_ACTION,
    input: {},
    inputUiInfo: {},
  },
} as never;

beforeEach(() => get.mockReset());

describe('stepUtils.getMetadata for an audience:ai action', () => {
  it('asks the API for every audience, not just human', async () => {
    get.mockResolvedValue(unfilteredSlack());
    await stepUtils.getMetadata(step, LocalesEnum.ENGLISH);
    expect(get).toHaveBeenCalled();
    for (const call of get.mock.calls) {
      expect(call[0].audience).toBe('all');
    }
  });

  it('resolves the display name when the action is present', async () => {
    get.mockResolvedValue(unfilteredSlack());
    const metadata = await stepUtils.getMetadata(step, LocalesEnum.ENGLISH);
    expect(metadata.actionOrTriggerOrAgentDisplayName).toBe('Search messages');
  });

  it('does not throw when the action was filtered out of the response', async () => {
    get.mockResolvedValue(humanFilteredSlack());
    await expect(
      stepUtils.getMetadata(step, LocalesEnum.ENGLISH),
    ).resolves.toBeDefined();
  });
});
