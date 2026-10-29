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
  LockedFeatureCard,
  LockedFeatureUsageMeter,
  FeatureKey,
  useLockedFeature,
} from '@/features/billing';

import { AdminPageLockContext } from './admin/admin-page';

export function LockedFeatureUsage({
  unlocked,
  featureKey,
  used,
  limit,
  label,
  children,
}: LockedFeatureUsageProps) {
  const lockedFeature = useLockedFeature({ unlocked, featureKey });
  return (
    <div className="flex flex-wrap items-center gap-4">
      <LockedFeatureUsageMeter
        lockedFeature={lockedFeature}
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
  const lockedFeature = useLockedFeature({ unlocked: !locked, featureKey });
  if (!lockedFeature.locked) {
    return <>{children}</>;
  }
  return (
    <LockedPreview
      callout={
        <LockedFeatureCard
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

type LockedFeatureUsageProps = {
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
