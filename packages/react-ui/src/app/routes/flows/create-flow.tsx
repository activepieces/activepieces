import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { projectHooks } from '@/hooks/project-hooks';
import {
  FLOW_TEMPLATE_JSON_QUERY_PARAM,
  NEW_FLOW_FOLDER_NAME_QUERY_PARAM,
  NEW_FLOW_QUERY_PARAM,
} from '@/lib/utils';
import { FlowOperationType, FlowTemplate } from '@activepieces/shared';

const decodeFlowTemplateJson = (uriEncodedFlowJson: string | null) => {
  if (!uriEncodedFlowJson) {
    return null;
  }
  const flowJson = decodeURIComponent(uriEncodedFlowJson);
  try {
    return JSON.parse(flowJson) as FlowTemplate;
  } catch (error) {
    console.error('Error decoding flow json', error);
    return null;
  }
};
const CreateFlowPage = () => {
  const navigate = useNavigate();
  const [queryParams] = useSearchParams();
  const uriEncodedFlowTemplateJson = queryParams.get(
    FLOW_TEMPLATE_JSON_QUERY_PARAM,
  );
  const flowTemplate = decodeFlowTemplateJson(uriEncodedFlowTemplateJson);
  const projectId = projectHooks.useCurrentProject().data.id;
  const newFlowFolderName = queryParams.get(NEW_FLOW_FOLDER_NAME_QUERY_PARAM);
  useSuspenseQuery({
    queryKey: ['create-flow'],
    queryFn: async () => {
      const flow = await flowsApi.create({
        displayName: flowTemplate?.template.displayName ?? 'Untitled Flow',
        projectId,
        folderName: newFlowFolderName ?? undefined,
      });
      if (flowTemplate) {
        try {
          await flowsApi.update(flow.id, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
              displayName: flowTemplate.name,
              trigger: flowTemplate.template.trigger,
              schemaVersion: flowTemplate.template.schemaVersion,
            },
          });
        } catch (error) {
          console.error('Error importing flow', error);
        }
      }
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`, {
        replace: true,
      });
      return flow;
    },
    staleTime: 0,
  });

  return <></>;
};

CreateFlowPage.displayName = 'CreateFlowPage';
export default CreateFlowPage;
