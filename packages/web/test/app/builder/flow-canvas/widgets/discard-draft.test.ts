// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  runDiscard,
  RunDiscardDeps,
} from '@/app/builder/flow-canvas/widgets/discard-draft';

const makePublishedFlow = () =>
  ({
    id: 'flow-1',
    publishedVersionId: 'v3',
    version: { id: 'v3', state: 'LOCKED', displayName: 'Test' },
  } as unknown as Awaited<ReturnType<RunDiscardDeps['fetchFlow']>>);

const makeDeps = (overrides: Partial<RunDiscardDeps> = {}): RunDiscardDeps => ({
  flow: { id: 'flow-1', publishedVersionId: 'v3' },
  requiresApproval: true,
  overWriteDraftWithVersion: vi.fn(async () => undefined),
  publish: vi.fn(async () => undefined),
  fetchFlow: vi.fn(async () => makePublishedFlow()),
  setFlow: vi.fn(),
  setVersion: vi.fn(),
  ...overrides,
});

describe('runDiscard', () => {
  it('is a no-op when the flow has no published version', async () => {
    const deps = makeDeps({
      flow: { id: 'flow-1', publishedVersionId: null },
    });

    await runDiscard(deps);

    expect(deps.overWriteDraftWithVersion).not.toHaveBeenCalled();
    expect(deps.publish).not.toHaveBeenCalled();
    expect(deps.fetchFlow).not.toHaveBeenCalled();
    expect(deps.setFlow).not.toHaveBeenCalled();
    expect(deps.setVersion).not.toHaveBeenCalled();
  });

  it('overwrites the draft with the published version content first', async () => {
    const deps = makeDeps();

    await runDiscard(deps);

    expect(deps.overWriteDraftWithVersion).toHaveBeenCalledWith({
      flowId: 'flow-1',
      versionId: 'v3',
    });
  });

  it('does not call publish in approval mode (avoids creating a new approval request)', async () => {
    const deps = makeDeps({ requiresApproval: true });

    await runDiscard(deps);

    expect(deps.publish).not.toHaveBeenCalled();
  });

  it('navigates the user to the published locked version after discard in approval mode', async () => {
    const published = makePublishedFlow();
    const deps = makeDeps({
      requiresApproval: true,
      fetchFlow: vi.fn(async () => published),
    });

    await runDiscard(deps);

    expect(deps.fetchFlow).toHaveBeenCalledWith('flow-1', { versionId: 'v3' });
    expect(deps.setFlow).toHaveBeenCalledWith(published);
    expect(deps.setVersion).toHaveBeenCalledWith(published.version);
  });

  it('overwrites the draft before navigating to the published version', async () => {
    const order: string[] = [];
    const deps = makeDeps({
      overWriteDraftWithVersion: vi.fn(async () => {
        order.push('overwrite');
      }),
      fetchFlow: vi.fn(async () => {
        order.push('fetch');
        return makePublishedFlow();
      }),
    });

    await runDiscard(deps);

    expect(order).toEqual(['overwrite', 'fetch']);
  });
});
