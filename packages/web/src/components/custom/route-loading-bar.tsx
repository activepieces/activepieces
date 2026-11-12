import { createPortal } from 'react-dom';

import { pageColumnUtils } from '@/lib/page-column-utils';

export function RouteLoadingBar() {
  const bar = (
    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-accent-5 z-50">
      <div className="h-full w-1/4 bg-accent-9 rounded-full animate-indeterminate-progress" />
    </div>
  );

  const container = pageColumnUtils.element();
  if (container) {
    return createPortal(bar, container);
  }

  return (
    <div className="h-full w-full">
      <div className="h-0.5 w-full overflow-hidden bg-accent-5">
        <div className="h-full w-1/4 bg-accent-9 rounded-full animate-indeterminate-progress" />
      </div>
    </div>
  );
}
