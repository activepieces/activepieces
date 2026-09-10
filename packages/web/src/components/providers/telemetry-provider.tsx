import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  ApEdition,
  ApEnvironment,
  ApFlagId,
  DeploymentKind,
  isCloudOnlyTelemetryEvent,
  pickTelemetryPii,
  TelemetryEvent,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import posthog from 'posthog-js';
import React, { useEffect, useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { acquisitionUtils } from '@/lib/acquisition-utils';
import { CLOUD_HOSTNAME, isRunningCloudInDevMode } from '@/lib/api';
import { errorReporting } from '@/lib/error-reporting';
import { telemetryUtils } from '@/lib/telemetry-utils';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const identifiedKey = useRef<string | null>(null);

  const { data: configuration } =
    platformConfigurationHooks.useCurrentPlatformConfiguration();
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<ApEnvironment>(
    ApFlagId.ENVIRONMENT,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();

  const isCloud = edition === ApEdition.CLOUD;
  const isDevEnvironment = flagEnvironment === ApEnvironment.DEVELOPMENT;
  const isPreLoginCloudFunnel =
    isNil(currentUser) &&
    isCloud &&
    window.location.hostname === CLOUD_HOSTNAME;
  const isSignedInWithAnalyticsOn =
    !isNil(currentUser) &&
    (isCloud || configuration?.isProductTelemetryEnabled === true);
  const telemetryEnabled =
    (isPreLoginCloudFunnel || isSignedInWithAnalyticsOn) &&
    !isRunningCloudInDevMode &&
    (!isDevEnvironment || isPosthogDevOptIn());
  const deployment = resolveDeploymentKind({
    edition,
    environment: flagEnvironment,
  });

  const posthogInitialized = useRef(false);

  useEffect(() => {
    if (posthogInitialized.current) {
      return;
    }
    const isEmbedded =
      embedState.isEmbedded || window.location.pathname.startsWith('/embed');
    if (!telemetryEnabled || isEmbedded || isNil(edition)) {
      return;
    }
    posthogInitialized.current = true;

    posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      cross_subdomain_cookie: true,
      autocapture: isCloud
        ? {
            url_allowlist: [
              /\/sign-up/,
              /\/sign-in/,
              /\/verify-email/,
              /\/forget-password/,
              /\/reset-password/,
              /\/invitation/,
              /\/authenticate/,
            ],
          }
        : false,
      capture_pageview: 'history_change',
      capture_pageleave: true,
      capture_dead_clicks: isCloud,
      rageclick: isCloud,
      enable_heatmaps: isCloud,
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie',
      disable_session_recording: true,
      enable_recording_console_log: false,
      session_recording: {
        maskAllInputs: true,
      },
    });

    posthog.register({ source_site: 'product', deployment });

    if (isCloud && isInRecordingSample(posthog.get_distinct_id())) {
      posthog.startSessionRecording();
    }
  }, [telemetryEnabled, embedState.isEmbedded, edition, isCloud, deployment]);

  useEffect(() => {
    if (!posthogInitialized.current) {
      return;
    }
    posthog.register({
      activepiecesEdition: edition ?? ApEdition.COMMUNITY,
      activepiecesVersion: flagCurrentVersion ?? UNKNOWN_FLAG_VALUE,
      activepiecesEnvironment: flagEnvironment ?? UNKNOWN_FLAG_VALUE,
      deployment,
    });
  }, [
    telemetryEnabled,
    edition,
    embedState.isEmbedded,
    flagCurrentVersion,
    flagEnvironment,
    deployment,
  ]);

  useEffect(() => {
    errorReporting.init();
    errorReporting.flushBuffered();
  }, []);

  useDeepCompareEffect(() => {
    if (isNil(currentUser) || !telemetryEnabled) {
      return;
    }
    const identityKey = `${currentUser.id}:${edition ?? ''}`;
    if (identityKey === identifiedKey.current) {
      return;
    }
    identifiedKey.current = identityKey;
    initTelemetry();
  }, [telemetryEnabled, currentUser, edition]);

  const initTelemetry = () => {
    if (isNil(currentUser)) {
      return;
    }
    const currentVersion = flagCurrentVersion || UNKNOWN_FLAG_VALUE;
    const environment = flagEnvironment || UNKNOWN_FLAG_VALUE;

    posthog.identify(
      currentUser.id,
      {
        ...pickTelemetryPii({
          edition: edition ?? ApEdition.COMMUNITY,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        }),
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: environment,
        deployment,
      },
      acquisitionUtils.getAcquisitionParams(),
    );

    if (currentUser.platformId) {
      posthog.group('platform', currentUser.platformId);
    }

    if (isRecentlyCreated({ created: currentUser.created })) {
      acquisitionUtils.clearAcquisitionParams();
    }
  };

  const reset = () => {
    telemetryUtils.resetIdentity();
    identifiedKey.current = null;
  };

  const capture = (event: TelemetryEvent) => {
    if (
      !telemetryEnabled ||
      (!isCloud && isCloudOnlyTelemetryEvent(event.name))
    ) {
      return;
    }
    posthog.capture(event.name, event.payload);
  };

  return (
    <TelemetryContext.Provider value={{ capture, reset }}>
      {children}
    </TelemetryContext.Provider>
  );
};

const UNKNOWN_FLAG_VALUE = '0.0.0';

const RECORDING_SAMPLE_RATE = 0.1;

const POSTHOG_DEV_OPT_IN_KEY = 'ap_posthog_dev';

const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

function isInRecordingSample(distinctId: string): boolean {
  let hash = 5381;
  for (let i = 0; i < distinctId.length; i++) {
    hash = (hash * 33) ^ distinctId.charCodeAt(i);
  }
  return (hash >>> 0) / 0xffffffff < RECORDING_SAMPLE_RATE;
}

function isPosthogDevOptIn(): boolean {
  const { data } = tryCatchSync(
    () => localStorage.getItem(POSTHOG_DEV_OPT_IN_KEY) === '1',
  );
  return data === true;
}

function resolveDeploymentKind({
  edition,
  environment,
}: {
  edition: ApEdition | null | undefined;
  environment: ApEnvironment | null | undefined;
}): DeploymentKind {
  if (edition === ApEdition.CLOUD) {
    return DeploymentKind.CLOUD;
  }
  if (environment === ApEnvironment.DEVELOPMENT) {
    return DeploymentKind.DEV;
  }
  return DeploymentKind.SELF_HOSTED;
}

function isRecentlyCreated({ created }: { created: string }): boolean {
  const createdAt = dayjs(created);
  return createdAt.isValid() && dayjs().diff(createdAt) < NEW_ACCOUNT_WINDOW_MS;
}

interface TelemetryContextType {
  capture: (event: TelemetryEvent) => void;
  reset: () => void;
}

const TelemetryContext = React.createContext<TelemetryContextType>({
  capture: () => {},
  reset: () => {},
});

export const useTelemetry = () => React.useContext(TelemetryContext);

export default TelemetryProvider;
