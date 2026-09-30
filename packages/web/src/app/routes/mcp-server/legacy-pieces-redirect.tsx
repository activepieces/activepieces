import { Navigate, useSearchParams } from 'react-router-dom';

import { buildToolsParams } from './mcp-nav';

export function LegacyPiecesRedirect() {
  const [params] = useSearchParams();
  const search = new URLSearchParams(
    buildToolsParams({
      projectId: params.get('project'),
      segment: 'pieces',
    }),
  ).toString();
  return <Navigate to={`/mcp-server/tools?${search}`} replace />;
}
