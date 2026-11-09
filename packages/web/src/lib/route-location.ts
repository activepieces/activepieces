import { RouteObject } from 'react-router-dom';

const tracked: { pathname: string | null; routes: RouteObject[] } = {
  pathname: null,
  routes: [],
};

function track(router: TrackableRouter): void {
  tracked.routes = router.routes;
  router.subscribe((state) => {
    tracked.pathname = state.location.pathname;
  });
}

function pathname(): string {
  return tracked.pathname ?? window.location.pathname;
}

export const routeLocation = { track, pathname };

type TrackableRouter = {
  routes: RouteObject[];
  subscribe: (
    listener: (state: { location: { pathname: string } }) => void,
  ) => () => void;
};
