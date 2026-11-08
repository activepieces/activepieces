import { useEffect } from 'react';

import { resourceRegistry } from '../resources/registry';

import {
  FollowChange,
  followAlong,
  useFollowAlong,
  useFollowFlash,
} from './follow-along';

export function useAiHighlight(key: string): AiHighlightProps {
  const flashing = useFollowFlash(key);
  useEffect(() => {
    const unseen = Object.values(useFollowAlong.getState().runs)
      .flatMap((run) => run.changes)
      .filter((change) => touches({ change, key }) && !shown.has(change));
    if (unseen.length > 0) {
      unseen.forEach((change) => shown.add(change));
      followAlong.flash([key]);
    }
    return followAlong.onToolDone((change) => {
      if (!touches({ change, key })) return;
      shown.add(change);
      followAlong.flash([key]);
    });
  }, [key]);
  return {
    'data-ai-field': key,
    className: flashing ? 'ap-follow-flash' : undefined,
  };
}

function touches({
  change,
  key,
}: {
  change: FollowChange;
  key: string;
}): boolean {
  return (
    resourceRegistry.isChange(change.outcome) && change.highlights.includes(key)
  );
}

const shown = new WeakSet<FollowChange>();

export type AiHighlightProps = {
  'data-ai-field': string;
  className: string | undefined;
};
