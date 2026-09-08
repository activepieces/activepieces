import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const AfterImportFlowRedirect = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!flowId) {
      return;
    }
    queryClient.removeQueries({
      queryKey: ['flow', flowId],
    });
    navigate(`/flows/${flowId}`, { replace: true });
  }, []);
  return null;
};
