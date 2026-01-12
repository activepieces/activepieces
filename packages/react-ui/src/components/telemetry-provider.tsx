import React from 'react';

import { TelemetryEvent } from '@activepieces/shared';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

/**
 * No-op telemetry provider - telemetry has been removed from this fork.
 * This provider is kept to maintain component structure compatibility.
 */
const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  return (
    <TelemetryContext.Provider value={{ capture: () => {}, reset: () => {} }}>
      {children}
    </TelemetryContext.Provider>
  );
};

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
