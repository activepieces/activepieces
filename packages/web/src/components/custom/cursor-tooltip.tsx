import { PointerEvent as ReactPointerEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// A tooltip that appears right beside the cursor — for long thin targets
// (resize lines) where an anchored tooltip would sit far from the pointer.
// It stays where it appeared (it does not follow the mouse); leaving and
// re-entering shows it at the new spot. Each line's action ("Click", "Drag")
// keeps the full text color, its description is dimmed.
// Spread `handlers` on the target and render `tooltip`.
export function useCursorTooltip({
  lines,
  disabled = false,
}: {
  lines: CursorTooltipLine[];
  disabled?: boolean;
}): CursorTooltip {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    if (disabled) {
      setPosition(null);
    }
  }, [disabled]);

  const handlers = {
    onPointerEnter: (event: ReactPointerEvent) =>
      setPosition({ x: event.clientX, y: event.clientY }),
    onPointerLeave: () => setPosition(null),
  };

  const tooltip =
    position && !disabled
      ? createPortal(
          <div
            className="pointer-events-none fixed z-50 w-max -translate-y-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs"
            style={{ left: position.x + 10, top: position.y }}
          >
            {lines.map((line) => (
              <div key={line.action}>
                <span className="text-background">{line.action}</span>{' '}
                <span className="text-background/60">{line.description}</span>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return { handlers, tooltip };
}

export type CursorTooltipLine = {
  action: string;
  description: string;
};

type CursorTooltip = {
  handlers: {
    onPointerEnter: (event: ReactPointerEvent) => void;
    onPointerLeave: () => void;
  };
  tooltip: React.ReactNode;
};
