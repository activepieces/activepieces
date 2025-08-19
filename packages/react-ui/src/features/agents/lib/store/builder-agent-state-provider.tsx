import React, { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { Agent } from '@activepieces/shared';

import {
  createBuilderAgentStore,
  BuilderAgentState,
} from './builder-agent-state';

interface BuilderAgentContextValue {
  store: ReturnType<typeof createBuilderAgentStore>;
}

const BuilderAgentContext = createContext<BuilderAgentContextValue | null>(
  null,
);

interface BuilderAgentProviderProps {
  children: React.ReactNode;
  agent: Agent;
}

export function BuilderAgentProvider({
  children,
  agent,
}: BuilderAgentProviderProps) {
  const store = React.useMemo(() => createBuilderAgentStore(agent), [agent]);

  return (
    <BuilderAgentContext.Provider value={{ store }}>
      {children}
    </BuilderAgentContext.Provider>
  );
}

export function useBuilderAgentState<T>(
  selector: (state: BuilderAgentState) => T,
) {
  const builderAgentContext = useContext(BuilderAgentContext);
  if (!builderAgentContext) {
    throw new Error('Builder agent context not found');
  }
  return useStore(builderAgentContext.store, selector);
}
