import { Navigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { ACTIVE_TAB_QUERY_PARAM, FlowsPageTabs } from '../flows';

export const FlowsRunsPageReroute = () => {
  const [searchParams] = useSearchParams();
  const searchParamsWithActiveTab = new URLSearchParams(searchParams);
  searchParamsWithActiveTab.set(ACTIVE_TAB_QUERY_PARAM, FlowsPageTabs.HISTORY);
  return <Navigate to={`/flows?${searchParamsWithActiveTab.toString()}`} />;
};
