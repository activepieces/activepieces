import { PlatformAdminSurface } from '@activepieces/shared';
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
import { cn } from '@/lib/utils';

import { AdminPageLockContext } from './admin/admin-page-lock';

export function EnterpriseGate(props: EnterpriseGateProps) {
  const gate = useEnterpriseGate({
    unlocked: props.unlocked,
    featureKey: props.featureKey,
  });

  if (props.mode === 'limit') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4', props.className)}>
        <EnterpriseUsageMeter
          gate={gate}
          used={props.used}
          limit={props.limit}
          label={props.label}
        />
        <EnterpriseGateContext.Provider value={gate}>
          {props.children}
        </EnterpriseGateContext.Provider>
      </div>
    );
  }

  if (!gate.locked) {
    return (
      <EnterpriseGateContext.Provider value={gate}>
        {props.children}
      </EnterpriseGateContext.Provider>
    );
  }

  return (
    <LockedPreview
      callout={
        <EnterpriseLockedCard
          featureKey={props.featureKey}
          fallbackHeadline={props.title}
          surface={PlatformAdminSurface.SAMPLE}
        />
      }
    >
      {props.children}
    </LockedPreview>
  );
}

export function EnterpriseLockedSection({
  unlocked,
  featureKey,
  title,
  description,
  className,
}: EnterpriseLockedSectionProps) {
  const gate = useEnterpriseGate({ unlocked, featureKey });
  if (!gate.locked) {
    return null;
  }
  return (
    <EnterpriseLockedCard
      featureKey={featureKey}
      headline={title}
      description={description}
      surface={PlatformAdminSurface.TEASER}
      className={className}
    />
  );
}

export function useEnterpriseGateContext() {
  return useContext(EnterpriseGateContext);
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

const EnterpriseGateContext = createContext<ReturnType<
  typeof useEnterpriseGate
> | null>(null);

const InsideFeatureSampleContext = createContext(false);

export type EnterpriseGateProps =
  | (EnterpriseGateBaseProps & {
      mode: 'preview';
      title?: string;
    })
  | (EnterpriseGateBaseProps & {
      mode: 'limit';
      used: number;
      limit: number | null | undefined;
      label: string;
      className?: string;
    });

type EnterpriseGateBaseProps = {
  unlocked: boolean;
  featureKey: FeatureKey;
  children: ReactNode;
};

type EnterpriseLockedSectionProps = {
  unlocked: boolean;
  featureKey: FeatureKey;
  title?: string;
  description?: string;
  className?: string;
};
