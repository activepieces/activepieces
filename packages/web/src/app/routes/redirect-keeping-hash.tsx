import { Navigate, useLocation } from 'react-router-dom';

export function RedirectKeepingHash({ to }: { to: string }) {
  const { hash, state } = useLocation();
  return <Navigate to={`${to}${hash}`} state={state} replace />;
}
