import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

function toTab(value: string | undefined): McpTab {
  return value === 'connections' ? value : 'connect';
}

export function useMcpNav(): McpNav {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientKey = params.get('client');

  return {
    clientKey,
    tab: toTab(tab),
    view: clientKey ? 'client' : params.has('browse') ? 'browse' : 'landing',
    showLanding: () => setParams({}),
    showBrowse: () => setParams({ browse: '1' }),
    showClient: (key: string) => setParams({ client: key }),
    showTab: (value: string) => navigate(`/mcp-server/${toTab(value)}`),
  };
}

export type McpTab = 'connect' | 'connections';

export type McpView = 'landing' | 'browse' | 'client';

export type McpNav = {
  tab: McpTab;
  view: McpView;
  clientKey: string | null;
  showLanding: () => void;
  showBrowse: () => void;
  showClient: (key: string) => void;
  showTab: (value: string) => void;
};
