import { Navigate, useLocation } from 'react-router-dom';

export function RedirectKeepingSearch({ to }: { to: string }) {
  const { search, hash } = useLocation();
  const [pathname, targetSearch = ''] = to.split('?');
  const params = new URLSearchParams(search);
  new URLSearchParams(targetSearch).forEach((value, key) =>
    params.set(key, value),
  );
  const merged = params.toString();
  return (
    <Navigate
      to={{ pathname, search: merged === '' ? '' : `?${merged}`, hash }}
      replace
    />
  );
}
