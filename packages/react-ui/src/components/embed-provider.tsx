import React, { createContext, useContext, useState } from 'react';

type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
  hideLogoInBuilder: boolean;
  disableNavigationInBuilder: boolean;
  hideFolders: boolean;
  hideFlowNameInBuilder: boolean;
  sdkVersion?: string;
  predefinedConnectionName?: string;
};

const defaultState: EmbeddingState = {
  isEmbedded: false,
  hideSideNav: false,
  hideLogoInBuilder: false,
  prefix: '',
  disableNavigationInBuilder: false,
  hideFolders: false,
  hideFlowNameInBuilder: false,
};

const EmbeddingContext = createContext<{
  embedState: EmbeddingState;
  setEmbedState: React.Dispatch<React.SetStateAction<EmbeddingState>>;
}>({
  embedState: defaultState,
  setEmbedState: () => {},
});

export const useEmbedding = () => useContext(EmbeddingContext);

type EmbeddingProviderProps = {
  children: React.ReactNode;
};

const EmbeddingProvider = ({ children }: EmbeddingProviderProps) => {
  const [state, setState] = useState<EmbeddingState>(defaultState);

  return (
    <EmbeddingContext.Provider
      value={{ embedState: state, setEmbedState: setState }}
    >
      {children}
    </EmbeddingContext.Provider>
  );
};

EmbeddingProvider.displayName = 'EmbeddingProvider';

export { EmbeddingProvider };
