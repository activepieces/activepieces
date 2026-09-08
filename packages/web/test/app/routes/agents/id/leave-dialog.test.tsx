// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LeaveWithoutSavingDialog } from '@/app/routes/agents/id';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(cleanup);

describe('LeaveWithoutSavingDialog', () => {
  it('renders nothing while closed, so a clean exit is never interrupted', () => {
    render(
      <LeaveWithoutSavingDialog
        open={false}
        onKeepEditing={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.queryByText('Leave without saving?')).toBeNull();
  });

  it('warns that the edits are discarded, not merely unsaved', () => {
    render(
      <LeaveWithoutSavingDialog
        open
        onKeepEditing={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(
      screen.getByText(
        'These edits have not gone live yet. Leave now and they are discarded.',
      ),
    ).toBeTruthy();
  });

  it('keeps editing without discarding when the safe choice is taken', () => {
    const onKeepEditing = vi.fn();
    const onDiscard = vi.fn();
    render(
      <LeaveWithoutSavingDialog
        open
        onKeepEditing={onKeepEditing}
        onDiscard={onDiscard}
      />,
    );

    screen.getByText('Keep editing').click();

    expect(onKeepEditing).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('discards only on the destructive choice', () => {
    const onKeepEditing = vi.fn();
    const onDiscard = vi.fn();
    render(
      <LeaveWithoutSavingDialog
        open
        onKeepEditing={onKeepEditing}
        onDiscard={onDiscard}
      />,
    );

    screen.getByText('Discard changes').click();

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onKeepEditing).not.toHaveBeenCalled();
  });
});
