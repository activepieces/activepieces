import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { flowHooks } from '@/features/flows';

export const AfterImportFlowRedirect = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!flowId) {
      return;
    }
    flowHooks.removeFlowFromCache({ flowId, queryClient });
    navigate(`/flows/${flowId}`, { replace: true });
  }, []);
  return null;
};
