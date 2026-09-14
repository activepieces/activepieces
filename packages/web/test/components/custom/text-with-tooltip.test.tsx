/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';

let container: HTMLDivElement;
let root: Root;

function render(className: string) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TextWithTooltip tooltipMessage="the whole thing">
        <p className={className}>a long summary</p>
      </TextWithTooltip>,
    );
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
    const paragraph = render('line-clamp-2 text-xs');

    expect(paragraph?.className).toContain('line-clamp-2');
    expect(paragraph?.className).not.toContain('truncate');
  });

  it('still truncates a caller that did not clamp, which is what every existing caller relies on', () => {
    const paragraph = render('text-xs');

    expect(paragraph?.className).toContain('truncate');
  });
});
