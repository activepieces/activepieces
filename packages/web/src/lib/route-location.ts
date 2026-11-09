const tracked: { pathname: string | null } = { pathname: null };

function track(router: TrackableRouter): void {
  router.subscribe((state) => {
    tracked.pathname = state.location.pathname;
  });
}

function pathname(): string {
  return tracked.pathname ?? window.location.pathname;
}

export const routeLocation = { track, pathname };

type TrackableRouter = {
  subscribe: (
    listener: (state: { location: { pathname: string } }) => void,
  ) => () => void;
};
