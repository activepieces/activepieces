import { createPortal } from 'react-dom';

export function RouteLoadingBar() {
  const bar = (
    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-primary/20 z-50">
      <div className="h-full w-1/4 bg-primary rounded-full animate-indeterminate-progress" />
    </div>
  );

  const container = document.getElementById('dashboard-content-container');
  if (container) {
    return createPortal(bar, container);
  }

  return (
    <div className="h-full w-full">
      <div className="h-0.5 w-full overflow-hidden bg-primary/20">
        <div className="h-full w-1/4 bg-primary rounded-full animate-indeterminate-progress" />
      </div>
    </div>
  );
}
