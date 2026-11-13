// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Settings2Icon,
  Settings2IconHandle,
} from '@/components/icons/settings2';

function AnimatedOnMount({ action }: { action: keyof Settings2IconHandle }) {
  const ref = useRef<Settings2IconHandle>(null);
  useEffect(() => {
    ref.current?.[action]();
  }, [action]);
  return <Settings2Icon ref={ref} />;
}

describe('Settings2Icon', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['startAnimation', 'stopAnimation'] as const)(
    'writes a numeric cx when %s runs on mount',
    async (action) => {
      const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');

      render(<AnimatedOnMount action={action} />);
      await act(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const cxWrites = setAttribute.mock.calls
        .filter(([name]) => name === 'cx')
        .map(([, value]) => String(value));
      expect(cxWrites.length).toBeGreaterThan(0);
      expect(cxWrites.filter((cx) => Number.isNaN(Number(cx)))).toEqual([]);
    },
  );
});
