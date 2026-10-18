import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  EnterpriseLockedCard,
  EnterpriseUsageMeter,
  FeatureKey,
  useEnterpriseGate,
} from '@/features/billing';

import { AdminPageLockContext } from './admin/admin-page-lock';

export function EnterpriseGate({
  unlocked,
  featureKey,
  used,
  limit,
  label,
  children,
}: EnterpriseGateProps) {
  const gate = useEnterpriseGate({ unlocked, featureKey });
  return (
    <div className="flex flex-wrap items-center gap-4">
      <EnterpriseUsageMeter
        gate={gate}
        used={used}
        limit={limit}
        label={label}
      />
      {children}
    </div>
  );
}

export function FeatureSample({
  locked,
  title,
  featureKey,
  children,
}: FeatureSampleProps) {
  const gate = useEnterpriseGate({ unlocked: !locked, featureKey });
  if (!gate.locked) {
    return <>{children}</>;
  }
  return (
    <LockedPreview
      callout={
        <EnterpriseLockedCard
          featureKey={featureKey}
          fallbackHeadline={t(title)}
          surface={PlatformAdminSurface.SAMPLE}
        />
      }
    >
      {children}
    </LockedPreview>
  );
}

export function useInsideFeatureSample(): boolean {
  return useContext(InsideFeatureSampleContext);
}

function LockedPreview({
  callout,
  children,
}: {
  callout: ReactNode;
  children: ReactNode;
}) {
  const [claimed, setClaimed] = useState(false);
  const claim = useCallback(() => setClaimed(true), []);
  const lock = useMemo(() => ({ callout, claim }), [callout, claim]);

  return (
    <AdminPageLockContext.Provider value={lock}>
      <InsideFeatureSampleContext.Provider value={true}>
        <div
          className={
            claimed
              ? 'contents'
              : 'flex min-h-0 w-full flex-1 flex-col gap-6 px-4 py-6 md:px-6'
          }
        >
          {claimed ? null : callout}
          <div
            inert={!claimed}
            aria-hidden={!claimed}
            className={
              claimed
                ? 'contents'
                : 'pointer-events-none flex min-h-0 flex-1 select-none flex-col opacity-50 grayscale mask-b-from-40%'
            }
          >
            {children}
          </div>
        </div>
      </InsideFeatureSampleContext.Provider>
    </AdminPageLockContext.Provider>
  );
}

const InsideFeatureSampleContext = createContext(false);

type EnterpriseGateProps = {
  unlocked: boolean;
  featureKey: FeatureKey;
  used: number;
  limit: number | null | undefined;
  label: string;
  children: ReactNode;
};

type FeatureSampleProps = {
  locked: boolean;
  featureKey: FeatureKey;
  title: string;
  children: ReactNode;
};
