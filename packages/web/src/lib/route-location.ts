import { matchRoutes, RouteObject } from 'react-router-dom';

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

function handleOf(path: string): unknown {
  const matches = matchRoutes(tracked.routes, path);
  return matches?.at(-1)?.route.handle;
}

export const routeLocation = { track, pathname, handleOf };

type TrackableRouter = {
  routes: RouteObject[];
  subscribe: (
    listener: (state: { location: { pathname: string } }) => void,
  ) => () => void;
};
