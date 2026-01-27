import { createContext, useContext, useState } from 'react';

import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

const ResizableVerticalPanelsContext = createContext<{
  height: number;
  setHeight: (height: number) => void;
}>({
  height: 50,
  setHeight: () => {},
});

export const ResizableVerticalPanelsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isViewingRun] = useBuilderStateContext((state) => [!isNil(state.run)]);
  const [height, setHeight] = useState(isViewingRun ? 65 : 40);
  return (
    <ResizableVerticalPanelsContext.Provider value={{ height, setHeight }}>
      {children}
    </ResizableVerticalPanelsContext.Provider>
  );
};

export const useResizableVerticalPanelsContext = () => {
  return useContext(ResizableVerticalPanelsContext);
};
