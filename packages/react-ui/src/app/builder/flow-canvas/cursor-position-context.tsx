import { createContext, useContext, useRef } from 'react';

const CursorPositionContext = createContext<{
  cursorPosition: { x: number; y: number };
  setCursorPosition: (position: { x: number; y: number }) => void;
}>({
  cursorPosition: { x: 0, y: 0 },
  setCursorPosition: () => {},
});

export const useCursorPosition = () => {
  return useContext(CursorPositionContext);
};

export const CursorPositionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const cursorPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const setCursorPosition = (position: { x: number; y: number }) => {
    cursorPositionRef.current = position;
  };
  return (
    <CursorPositionContext.Provider
      value={{ cursorPosition: cursorPositionRef.current, setCursorPosition }}
    >
      {children}
    </CursorPositionContext.Provider>
  );
};
