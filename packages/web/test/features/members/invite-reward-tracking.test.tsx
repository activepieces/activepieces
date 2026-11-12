// @vitest-environment jsdom
import { InviteRewardSurface, TelemetryEventName } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();
const offer = { visible: true };

vi.mock('i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('i18next')>()),
  t: (key: string) => key,
}));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));
vi.mock('@/features/members/hooks/use-invite-rewards', () => ({
  useInviteRewards: () => ({
    visible: offer.visible,
    platformId: 'platform_1',
    creditsPerInvite: 1000,
    rewardsEarned: 2,
    maxRewards: 4,
    rewardsLeft: 2,
    rewards: [],
    bonusCredits: 0,
  }),
}));
vi.mock('@/features/members/components/invite-user/invite-user-dialog', () => ({
  InviteUserDialog: ({ open }: { open: boolean }) =>
    open ? <div>invite dialog</div> : null,
}));

import {
  InviteRewardButton,
  InviteRewardCard,
} from '@/features/members/components/invite-reward/invite-reward';

describe('invite reward offer tracking', () => {
  beforeEach(() => {
    capture.mockReset();
    localStorage.clear();
    offer.visible = true;
  });

  it('records a sidebar card click and opens the invite dialog', () => {
    render(<InviteRewardCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));

    expect(capture).toHaveBeenCalledWith({
      name: TelemetryEventName.INVITE_REWARD_OFFER_CLICKED,
      payload: { surface: InviteRewardSurface.SIDEBAR_CARD, rewardsEarned: 2 },
    });
    screen.getByText('invite dialog');
  });

  it('keeps an open invite dialog when the offer hides, so an invitation link is not lost', () => {
    const { rerender } = render(<InviteRewardCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));

    offer.visible = false;
    rerender(<InviteRewardCard />);

    expect(screen.queryAllByRole('button', { name: 'Invite' })).toEqual([]);
    screen.getByText('invite dialog');
  });

  it('renders nothing when there is no offer and no open dialog', () => {
    offer.visible = false;

    const { container } = render(<InviteRewardButton />);

    expect(container.innerHTML).toBe('');
  });

  it('hides the sidebar card for the week after it is dismissed', () => {
    const { unmount } = render(<InviteRewardCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryAllByRole('button', { name: 'Invite' })).toEqual([]);
    unmount();
    render(<InviteRewardCard />);
    expect(screen.queryAllByRole('button', { name: 'Invite' })).toEqual([]);
  });

  it('stays hidden on a fresh page load within the week after a dismissal', () => {
    localStorage.setItem(
      'ap-invite-reward-card-dismissed:platform_1',
      new Date().toISOString(),
    );

    render(<InviteRewardCard />);

    expect(screen.queryAllByRole('button', { name: 'Invite' })).toEqual([]);
  });

  it('records a low-credits alert click', () => {
    render(<InviteRewardButton />);

    fireEvent.click(screen.getByRole('button'));

    expect(capture).toHaveBeenCalledWith({
      name: TelemetryEventName.INVITE_REWARD_OFFER_CLICKED,
      payload: {
        surface: InviteRewardSurface.CREDITS_ALERT,
        rewardsEarned: 2,
      },
    });
  });
});
