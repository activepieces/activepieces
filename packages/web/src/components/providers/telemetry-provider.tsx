import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  pickTelemetryPii,
  TelemetryEvent,
} from '@activepieces/shared';
import posthog from 'posthog-js';
import React, { useEffect, useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { acquisitionUtils } from '@/lib/acquisition-utils';
import { errorReporting } from '@/lib/error-reporting';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const identifiedKey = useRef<string | null>(null);

  const { data: telemetryEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TELEMETRY_ENABLED,
  );
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<string>(
    ApFlagId.ENVIRONMENT,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();

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

    const isCloud = edition === ApEdition.CLOUD;

    posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
      // Same-origin reverse proxy (/ingest) so ad blockers don't drop ingestion.
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      // Adopt the identity cookie the marketing site sets on `.activepieces.com`.
      cross_subdomain_cookie: true,
      // Limit autocapture to the auth funnel; the rest of the app doesn't need it.
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

    // Tag events so the shared project separates product from marketing traffic.
    posthog.register({ source_site: 'product' });

    acquisitionUtils.stashAcquisitionParams();

    if (isCloud && isInRecordingSample(posthog.get_distinct_id())) {
      posthog.startSessionRecording();
    }
  }, [telemetryEnabled, embedState.isEmbedded, edition]);

  useEffect(() => {
    if (!posthogInitialized.current) {
      return;
    }
    posthog.register({ activepiecesEdition: edition ?? ApEdition.COMMUNITY });
  }, [telemetryEnabled, edition, embedState.isEmbedded]);

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
    const currentVersion = flagCurrentVersion || '0.0.0';
    const environment = flagEnvironment || '0.0.0';

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
      },
      acquisitionUtils.getAcquisitionParams(),
    );

    if (currentUser.platformId) {
      posthog.group('platform', currentUser.platformId);
    }
  };

  const reset = () => {
    posthog.reset();
    identifiedKey.current = null;
  };

  const capture = (event: TelemetryEvent) => {
    if (telemetryEnabled) {
      posthog.capture(event.name, event.payload);
    }
  };

  return (
    <TelemetryContext.Provider value={{ capture, reset }}>
      {children}
    </TelemetryContext.Provider>
  );
};

const RECORDING_SAMPLE_RATE = 0.1;

function isInRecordingSample(distinctId: string): boolean {
  let hash = 5381;
  for (let i = 0; i < distinctId.length; i++) {
    hash = (hash * 33) ^ distinctId.charCodeAt(i);
  }
  return (hash >>> 0) / 0xffffffff < RECORDING_SAMPLE_RATE;
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
