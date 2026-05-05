import {
  FlowApprovalRequestState,
  FlowVersionState,
  isNil,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

import { RightSideBarType } from '@/app/builder/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { useBuilderStateContext } from '../../builder-hooks';

import LargeWidgetWrapper from './large-widget-wrapper';

const FlowApprovalBanner = () => {
  const [flow, flowVersion, setFlow, setVersion, setRightSidebar] =
    useBuilderStateContext((state) => [
      state.flow,
      state.flowVersion,
      state.setFlow,
      state.setVersion,
      state.setRightSidebar,
    ]);
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const featureEnabled = platform.plan.flowApprovalEnabled;
  const { data: latestApproval } = flowApprovalsHooks.useApprovalForVersion(
    featureEnabled ? flowVersion.id : undefined,
  );

  const { mutateAsync: approve, isPending: isApproving } =
    flowApprovalsHooks.useApprove();
  const { mutateAsync: reject, isPending: isRejecting } =
    flowApprovalsHooks.useReject();
  const { mutateAsync: withdraw, isPending: isWithdrawing } =
    flowApprovalsHooks.useWithdraw();
  const handleWithdraw = async (requestId: string) => {
    const previousVersion = flowVersion;
    setVersion({ ...flowVersion, state: FlowVersionState.DRAFT });
    setRightSidebar(RightSideBarType.NONE);
    try {
      await withdraw(requestId);
    } catch (err) {
      setVersion(previousVersion);
      throw err;
    }
  };
  const handleApprove = async (requestId: string) => {
    const previousFlow = flow;
    if (latestApproval) {
      setFlow({
        ...flow,
        publishedVersionId: latestApproval.flowVersionId,
        status: latestApproval.requestedStatus,
      });
      setVersion(flowVersion, false);
    }
    try {
      await approve(requestId);
    } catch (err) {
      setFlow(previousFlow);
      setVersion(previousFlow.version, false);
      throw err;
    }
  };

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!featureEnabled || isNil(latestApproval)) {
    return null;
  }
  if (flowVersion.state !== FlowVersionState.LOCKED) {
    return null;
  }
  if (latestApproval.state !== FlowApprovalRequestState.PENDING) {
    return null;
  }

  const isApprover = checkAccess(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS);
  const currentUserId = authenticationSession.getCurrentUserId();
  const isOwnRequest = latestApproval.submitterId === currentUserId;
  const showWithdraw = !isApprover || isOwnRequest;
  const busy = isApproving || isRejecting || isWithdrawing;

  return (
    <LargeWidgetWrapper>
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-5" />
        <span>{t('Awaiting approval to publish this flow.')}</span>
      </div>
      <div className="flex items-center gap-2">
        {isApprover && (
          <>
            <Button
              size="sm"
              variant="default"
              loading={isApproving}
              disabled={busy}
              onClick={() => handleApprove(latestApproval.id)}
            >
              {t('Approve')}
            </Button>
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                {t('Reject')}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Reject')}</DialogTitle>
                  <DialogDescription>
                    {t('Optional reason for rejection')}
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('Optional reason for rejection')}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      {t('Cancel')}
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    loading={isRejecting}
                    onClick={async () => {
                      await reject({
                        id: latestApproval.id,
                        body: { reason: rejectReason || undefined },
                      });
                      setRejectOpen(false);
                      setRejectReason('');
                    }}
                  >
                    {t('Reject')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {showWithdraw && (
          <Button
            size="sm"
            variant="ghost"
            loading={isWithdrawing}
            disabled={busy}
            onClick={() => handleWithdraw(latestApproval.id)}
          >
            {t('Withdraw request')}
          </Button>
        )}
      </div>
    </LargeWidgetWrapper>
  );
};

FlowApprovalBanner.displayName = 'FlowApprovalBanner';
export { FlowApprovalBanner };
