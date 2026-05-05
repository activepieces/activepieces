import { useCallback, useEffect, useRef, useState } from 'react';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type ApprovalRequest = {
  gateId: string;
  toolName: string;
  displayName: string;
};

async function sendApprovalDecision({
  gateId,
  approved,
}: {
  gateId: string;
  approved: boolean;
}): Promise<void> {
  const token = authenticationSession.getToken();
  await fetch(`${API_URL}/v1/chat/tool-approvals/${gateId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ approved }),
  });
}

export function useToolApproval({
  pendingApprovalRequest,
}: {
  pendingApprovalRequest: ApprovalRequest | null;
}) {
  const autoApproveRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!pendingApprovalRequest) return;
    setDismissed(false);
    if (autoApproveRef.current) {
      void sendApprovalDecision({
        gateId: pendingApprovalRequest.gateId,
        approved: true,
      });
    }
  }, [pendingApprovalRequest]);

  const hasActiveApproval =
    pendingApprovalRequest !== null && !autoApproveRef.current && !dismissed;

  const approve = useCallback(() => {
    if (!pendingApprovalRequest) return;
    setDismissed(true);
    void sendApprovalDecision({
      gateId: pendingApprovalRequest.gateId,
      approved: true,
    });
  }, [pendingApprovalRequest]);

  const approveAndRemember = useCallback(() => {
    if (!pendingApprovalRequest) return;
    setDismissed(true);
    autoApproveRef.current = true;
    void sendApprovalDecision({
      gateId: pendingApprovalRequest.gateId,
      approved: true,
    });
  }, [pendingApprovalRequest]);

  const reject = useCallback(() => {
    if (!pendingApprovalRequest) return;
    setDismissed(true);
    void sendApprovalDecision({
      gateId: pendingApprovalRequest.gateId,
      approved: false,
    });
  }, [pendingApprovalRequest]);

  const dismiss = useCallback(() => {
    if (!pendingApprovalRequest) return;
    setDismissed(true);
    void sendApprovalDecision({
      gateId: pendingApprovalRequest.gateId,
      approved: false,
    });
  }, [pendingApprovalRequest]);

  return {
    hasActiveApproval,
    approvalDisplayName: pendingApprovalRequest?.displayName ?? null,
    approve,
    approveAndRemember,
    reject,
    dismiss,
  };
}
