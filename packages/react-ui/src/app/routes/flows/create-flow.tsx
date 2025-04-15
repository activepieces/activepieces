import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { projectHooks } from '@/hooks/project-hooks';
import {
  FLOW_TEMPLATE_JSON_QUERY_PARAM,
  FOLDER_ID_QUERY_PARAM,
  NEW_FLOW_QUERY_PARAM,
} from '@/lib/utils';
import { FlowOperationType, FlowTemplate } from '@activepieces/shared';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { useEffect, useRef } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { toast } from '@/components/ui/use-toast';
import { t } from 'i18next';

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
  const newFlowFolderId = queryParams.get(FOLDER_ID_QUERY_PARAM);
  const hasCreatedFlow = useRef(false);
  const {mutate:createFlow} = useMutation({
    mutationFn: async () => {
      const folder = newFlowFolderId && newFlowFolderId !== 'NULL' ? await foldersApi.get(newFlowFolderId) : undefined;
      const flow = await flowsApi.create({
        displayName: flowTemplate?.template.displayName ?? t('Untitled'),
        projectId,
        folderName: folder?.displayName,
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
      return flow;
    }
    ,
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`, {
        replace: true,
      });
    },
    onError: (error) => {
      console.error('Error creating flow', error);
      toast({
        title: 'Error creating flow',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/flows');
    }
  })
  useEffect(() => {
    if (!hasCreatedFlow.current) {
      createFlow();
      hasCreatedFlow.current = true;
    }
  }, []);
 
  return <LoadingScreen></LoadingScreen>;
};

CreateFlowPage.displayName = 'CreateFlowPage';
export default CreateFlowPage;
