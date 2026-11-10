import { afterEach, describe, expect, test, vi } from 'vitest';
import { openPhoneCommon } from '../src/lib/common';
import { callDropdown } from '../src/lib/common/props';

afterEach(() => vi.restoreAllMocks());

const AUTH = { type: 'SECRET_TEXT', secret_text: 'key' };

function call({ id, createdAt }: { id: string; createdAt: string }) {
  return {
    id,
    direction: 'incoming',
    createdAt,
    status: 'missed',
    duration: 0,
  };
}

describe('call dropdown labels', () => {
  test('identical labels get their id appended and unique ones stay', async () => {
    vi.spyOn(openPhoneCommon, 'makeRequest').mockResolvedValue({
      data: [
        call({ id: 'AC1', createdAt: '2026-01-05T10:00:10Z' }),
        call({ id: 'AC2', createdAt: '2026-01-05T10:00:40Z' }),
        call({ id: 'AC3', createdAt: '2026-02-09T15:30:00Z' }),
      ],
    });
    const state = await callDropdown.options(
      Object.assign(Object.create(null), {
        auth: AUTH,
        phoneNumberId: 'PN1',
        participantNumber: '+15555555555',
      }),
      Object.assign(Object.create(null), {})
    );
    const [first, second, third] = state.options;
    expect(first.label.endsWith(' · AC1')).toBe(true);
    expect(second.label.endsWith(' · AC2')).toBe(true);
    expect(third.label.endsWith('AC3')).toBe(false);
    expect(third.label).toBe('Incoming · Feb 9, 3:30 PM UTC · missed');
    expect(state.options.map((option) => option.value)).toEqual([
      'AC1',
      'AC2',
      'AC3',
    ]);
    expect(
      state.options.find((option) => option.value === 'manual')
    ).toBeUndefined();
  });
});
