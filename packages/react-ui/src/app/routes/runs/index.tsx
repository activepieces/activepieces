import { Navigate } from "react-router";
import { ACTIVE_TAB_QUERY_PARAM, FlowsPageTabs } from "../flows";


export const FlowsRunsPageReroute = () => {
  return <Navigate to={`/flows?${ACTIVE_TAB_QUERY_PARAM}=${FlowsPageTabs.HISTORY}`} />;
}