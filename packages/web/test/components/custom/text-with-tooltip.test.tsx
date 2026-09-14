/**
 * @vitest-environment jsdom
 *
 * The component injects `truncate` so a single line can overflow horizontally. A caller that
 * clamps its own lines needs the opposite: keep the clamp, and measure the vertical overflow
 * that a clamp actually produces. Getting this wrong silently shows less text than the caller
 * asked for, which is how it was found.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';

let container: HTMLDivElement;
let root: Root;

type ClampableChild = React.ReactElement<
  React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }
>;

function render(child: ClampableChild) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<TextWithTooltip tooltipMessage="the whole thing">{child}</TextWithTooltip>);
  });
  return container.querySelector('p');
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('text that might not fit', () => {
  it('leaves a clamped caller its own line count instead of collapsing it to one', () => {
    const paragraph = render(<p className="line-clamp-2 text-xs">a long summary</p>);

    expect(paragraph?.className).toContain('line-clamp-2');
    expect(paragraph?.className).not.toContain('truncate');
  });

  it('still truncates a caller that did not clamp, which is what every existing caller relies on', () => {
    const paragraph = render(<p className="text-xs">a long name</p>);

    expect(paragraph?.className).toContain('truncate');
  });
});
