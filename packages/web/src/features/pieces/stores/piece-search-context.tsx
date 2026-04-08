import { createContext, useContext, useState } from 'react';

export type PieceSearchContextState = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
};

const PieceSearchContext = createContext<PieceSearchContextState>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export const PieceSearchProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <PieceSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </PieceSearchContext.Provider>
  );
};

export const usePieceSearchContext = () => useContext(PieceSearchContext);
