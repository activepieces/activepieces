import { createContext, useContext, useEffect, useRef } from 'react';

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

//Use this only in the component you want to re-render when the cursor position changes, i.e dragged step or note
export const useCursorPositionEffect = (
  callback: (position: { x: number; y: number }) => void,
) => {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      callback({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('pointermove', handleMouseMove);
    return () => {
      window.removeEventListener('pointermove', handleMouseMove);
    };
  }, []);
};
