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
    // Skip init entirely (not just capture) when telemetry is off, or for the
    // embed route — those are customers' end-users, not our funnel. Gate on the
    // /embed route only (matching embedState.isEmbedded, which is set on that
    // route), NOT on `window.self !== window.top`, so legitimately iframed
    // product sessions still get tagged.
    const isEmbedded =
      embedState.isEmbedded || window.location.pathname.startsWith('/embed');
    // Wait for EDITION too: isCloud drives init-time options (autocapture,
    // heatmaps, replay sampling) that posthog-js cannot change after init.
    // Both flags arrive in the same /v1/flags response, so in practice this
    // never delays init — it just makes "init with the wrong isCloud"
    // unrepresentable.
    if (!telemetryEnabled || isEmbedded || isNil(edition)) {
      return;
    }
    posthogInitialized.current = true;

    // Rich capture (autocapture, heatmaps, replay, dead clicks) is Cloud-only:
    // self-hosted (ce/ee) browsers belong to other companies' end users, whose
    // screens and interactions we have no legal basis to record. They still
    // send plain telemetry events, PII-gated via pickTelemetryPii.
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
      // Recording starts explicitly below so Cloud can be sampled client-side;
      // project-level sampling would also throttle the marketing site, which
      // shares the PostHog project and records at 100%.
      disable_session_recording: true,
      enable_recording_console_log: false,
      session_recording: {
        maskAllInputs: true,
      },
    });

    // Tag at init so even the first event carries it. source_site separates
    // product from marketing traffic; activepiecesEdition is registered in its
    // own effect below so it self-corrects if the EDITION flag resolves late.
    posthog.register({ source_site: 'product' });

    // Stash landing-URL acquisition params before SPA navigation strips them;
    // signup.submitted and identify read them back later in the session.
    acquisitionUtils.stashAcquisitionParams();

    if (isCloud && isInRecordingSample(posthog.get_distinct_id())) {
      posthog.startSessionRecording();
    }
  }, [telemetryEnabled, embedState.isEmbedded, edition]);

  // Keep activepiecesEdition correct even if the EDITION flag resolves after
  // init — the init guard above would otherwise pin a stale value for the whole
  // session. The name matches the backend property so cloud vs self-hosted stays
  // cleanly filterable in the shared project.
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
    // Re-identify when the user or the resolved edition changes, so Cloud PII is
    // attached even if the EDITION flag arrives after the first identify.
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

    // PII (email/name) is gated to Cloud — see pickTelemetryPii.
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
      // First-touch acquisition source (UTM only, no PII) persisted on the
      // person so it attaches to backend signed.up via person-on-events.
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

// Deterministic hash (djb2) so a device keeps the same sampling decision
// across pageloads, giving complete replays instead of fragments. Sampling is
// decided on the pre-identify device id at init time.
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
