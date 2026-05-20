import React, { createContext, useContext, useMemo, useRef } from 'react';

import { useBuilderStateContext } from '../builder-hooks';

const AutoTestBusContext = createContext<AutoTestBusValue | null>(null);

const AutoTestBusProvider = ({ children }: { children: React.ReactNode }) => {
  const runnersRef = useRef<Map<string, AutoTestRunner>>(new Map());
  const pendingRef = useRef<string | null>(null);
  const prepareStepForTesting = useBuilderStateContext(
    (state) => state.prepareStepForTesting,
  );

  const value = useMemo<AutoTestBusValue>(() => {
    const tryFire = (stepName: string): boolean => {
      const runner = runnersRef.current.get(stepName);
      if (!runner) return false;
      return runner();
    };

    return {
      requestAutoTest: (stepName) => {
        prepareStepForTesting(stepName);
        if (tryFire(stepName)) return;
        pendingRef.current = stepName;
      },
      registerRunner: (stepName, runner) => {
        runnersRef.current.set(stepName, runner);
        if (pendingRef.current === stepName && runner()) {
          pendingRef.current = null;
        }
        return () => {
          if (runnersRef.current.get(stepName) === runner) {
            runnersRef.current.delete(stepName);
          }
        };
      },
    };
  }, [prepareStepForTesting]);

  return (
    <AutoTestBusContext.Provider value={value}>
      {children}
    </AutoTestBusContext.Provider>
  );
};

const useAutoTestBus = () => {
  const ctx = useContext(AutoTestBusContext);
  if (!ctx) {
    throw new Error('useAutoTestBus must be used inside AutoTestBusProvider');
  }
  return ctx;
};

AutoTestBusProvider.displayName = 'AutoTestBusProvider';

type AutoTestRunner = () => boolean;

type AutoTestBusValue = {
  requestAutoTest: (stepName: string) => void;
  registerRunner: (stepName: string, runner: AutoTestRunner) => () => void;
};

export { AutoTestBusProvider, useAutoTestBus };
export type { AutoTestRunner };
