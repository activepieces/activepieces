import { useEffect, useState } from 'react';

// The Stage panel's non-scrolling box (rendered by StageContainer). Floating
// overlays (selection / bulk-action bars) portal into it and position `absolute`,
// so they dock to the *visible* bottom-centre of the Stage panel — staying put as
// the content underneath scrolls, and tracking the panel whether it's a narrow
// side panel or full width. Returns null outside the Stage (e.g. embed), where
// callers fall back to `fixed`.
export function useStageDockTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(STAGE_DOCK_TARGET_ID));
  }, []);

  return target;
}

export const STAGE_DOCK_TARGET_ID = 'stage-panel-box';
