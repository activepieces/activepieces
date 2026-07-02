import { describe, expect, it } from 'vitest';

import {
  activeContextUtils,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';

describe('chatPartUtils.getPendingCardKind', () => {
  it('maps action execution to an action receipt card', () => {
    expect(chatPartUtils.getPendingCardKind('ap_execute_action')).toBe(
      'action-receipt',
    );
  });

  it('maps image generation to an image card', () => {
    expect(chatPartUtils.getPendingCardKind('ap_generate_image')).toBe('image');
  });

  it('does not skeleton code execution (its recipe reveal covers the gap)', () => {
    expect(chatPartUtils.getPendingCardKind('ap_run_code')).toBeNull();
  });

  it('does not skeleton display tools or unknown tools', () => {
    expect(
      chatPartUtils.getPendingCardKind('ap_show_connection_picker'),
    ).toBeNull();
    expect(
      chatPartUtils.getPendingCardKind('ap_update_thinking_status'),
    ).toBeNull();
    expect(chatPartUtils.getPendingCardKind('mcp__whatever')).toBeNull();
  });
});

describe('activeContextUtils.isSame', () => {
  it('matches on type, id and projectId, ignoring focus', () => {
    const a = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step A', ref: 'step_1' },
    };
    const b = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step B', ref: 'step_2' },
    };
    expect(activeContextUtils.isSame(a, b)).toBe(true);
  });

  it('differs when the resource id changes', () => {
    expect(
      activeContextUtils.isSame(
        { type: 'flow', id: 'f1', projectId: 'p1' },
        { type: 'flow', id: 'f2', projectId: 'p1' },
      ),
    ).toBe(false);
  });
});

describe('activeContextUtils.isSameForMarker', () => {
  it('treats a different selected step on the same flow as a change', () => {
    const a = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step A', ref: 'step_1' },
    };
    const b = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step B', ref: 'step_2' },
    };
    expect(activeContextUtils.isSameForMarker(a, b)).toBe(false);
  });

  it('treats the same flow + same step as unchanged', () => {
    const ctx = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step A', ref: 'step_1' },
    };
    expect(activeContextUtils.isSameForMarker(ctx, { ...ctx })).toBe(true);
  });

  it('treats gaining a selection (no focus -> focus) as a change', () => {
    const noFocus = { type: 'flow', id: 'f1', projectId: 'p1' };
    const withFocus = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step A', ref: 'step_1' },
    };
    expect(activeContextUtils.isSameForMarker(noFocus, withFocus)).toBe(false);
  });

  it('still differs when the page changes regardless of focus', () => {
    expect(
      activeContextUtils.isSameForMarker(
        { type: 'flow', id: 'f1', projectId: 'p1' },
        { type: 'table', id: 't1', projectId: 'p1' },
      ),
    ).toBe(false);
  });

  it('treats a multi-step selection as different from a single-step one', () => {
    const single = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: { kind: 'flow-step', label: 'Step A', ref: 'step_1' },
    };
    const multi = {
      type: 'flow',
      id: 'f1',
      projectId: 'p1',
      focus: {
        kind: 'flow-steps',
        label: '3 steps selected (Step A, Step B, Step C)',
        ref: 'step_1,step_2,step_3',
      },
    };
    expect(activeContextUtils.isSameForMarker(single, multi)).toBe(false);
  });

  it('treats a different cell range on the same table as a change', () => {
    const a = {
      type: 'table',
      id: 't1',
      projectId: 'p1',
      focus: { kind: 'table-range', label: 'range · rows 1–3 · Name', ref: '0,0,0,2' },
    };
    const b = {
      type: 'table',
      id: 't1',
      projectId: 'p1',
      focus: { kind: 'table-range', label: 'range · rows 1–5 · Name', ref: '0,0,0,4' },
    };
    expect(activeContextUtils.isSameForMarker(a, b)).toBe(false);
  });
});

describe('activeContextUtils.formatPositionLabel', () => {
  it('combines resource name and focus label', () => {
    expect(
      activeContextUtils.formatPositionLabel({
        type: 'table',
        id: 't1',
        name: 'Leads',
        focus: { kind: 'table-cell', label: 'row 7 · Website' },
      }),
    ).toBe('Leads · row 7 · Website');
  });

  it('falls back to the type when there is no name', () => {
    expect(
      activeContextUtils.formatPositionLabel({ type: 'connections' }),
    ).toBe('connections');
  });

  it('returns an empty string when there is no context', () => {
    expect(activeContextUtils.formatPositionLabel(undefined)).toBe('');
  });
});
