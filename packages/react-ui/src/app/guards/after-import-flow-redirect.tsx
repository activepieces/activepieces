import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const AfterImportFlowRedirect = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/flows/${flowId}`, { replace: true });
  }, []);
  return <></>;
};
