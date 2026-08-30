import { useSearchParams } from 'react-router-dom';

export function useMcpNav(): McpNav {
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');

  return {
    clientKey,
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
  };
}

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  view: McpView;
  clientKey: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
};
