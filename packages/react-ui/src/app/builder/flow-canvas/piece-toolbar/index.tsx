import { useKeyPress } from '@xyflow/react';
import { Hand, MousePointer, Sparkles, Puzzle, GitBranch, Lightbulb } from 'lucide-react';
import {useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

const PanningModeIndicator = ({ toggled }: { toggled: boolean }) => {
  return (
    <div
      className={cn(
        'absolute transition-all bg-primary/15 w-full h-full top-0 left-0 rounded-md',
        {
          'opacity-0': !toggled,
        },
      )}
    ></div>
  );
};

export const PieceToolbar = () => {
  const [setPanningMode, panningMode] = useBuilderStateContext((state) => {
    return [state.setPanningMode, state.panningMode];
  });
  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const escapePressed = useKeyPress('Escape');
  const key1Pressed = useKeyPress('1');
  const key2Pressed = useKeyPress('2');
  const key3Pressed = useKeyPress('3');
  const key4Pressed = useKeyPress('4');
  const key5Pressed = useKeyPress('5');
  const key6Pressed = useKeyPress('6');
  const isInGrabMode = (spacePressed || panningMode === 'grab') && !shiftPressed;
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [cursorIcon, setCursorIcon] = useState<JSX.Element | null>(null);

  const handleButtonClick = (buttonType: string) => {
    if (selectedButton === buttonType) {
      setSelectedButton(null);
      setCursorIcon(null);
    } else {
      setSelectedButton(buttonType);
      
      // Set cursor icon based on selected button
      if (buttonType === 'ai') {
        setCursorIcon(<Sparkles className="text-amber-500" />);
      } else if (buttonType === 'pieces') {
        setCursorIcon(<Puzzle className="text-blue-500" />);
      } else if (buttonType === 'logic') {
        setCursorIcon(<GitBranch className="text-green-500" />);
      } else if (buttonType === 'thought') {
        setCursorIcon(<Lightbulb className="text-purple-500" />);
      }
    }
  };

  // Handle keyboard shortcuts (1-6)
  useEffect(() => {
    if (key1Pressed) {
      setPanningMode('pan');
      setSelectedButton(null);
      setCursorIcon(null);
    } else if (key2Pressed) {
      setPanningMode('grab');
      setSelectedButton(null);
      setCursorIcon(null);
    } else if (key3Pressed) {
      handleButtonClick('ai');
    } else if (key4Pressed) {
      handleButtonClick('pieces');
    } else if (key5Pressed) {
      handleButtonClick('logic');
    } else if (key6Pressed) {
      handleButtonClick('thought');
    }
  }, [key1Pressed, key2Pressed, key3Pressed, key4Pressed, key5Pressed, key6Pressed, setPanningMode]);

  // Handle escape key press to clear selection
  useEffect(() => {
    if (escapePressed && selectedButton) {
      setSelectedButton(null);
      setCursorIcon(null);
    }
  }, [escapePressed, selectedButton]);

  // Track mouse position and update cursor icon position
  useEffect(() => {
    if (!cursorIcon) return;

    const updateCursorPosition = (e: MouseEvent) => {
      const cursor = document.getElementById('custom-cursor');
      if (cursor) {
        cursor.style.left = `${e.clientX - 30}px`;
        cursor.style.top = `${e.clientY - 30}px`;
      }
    };

    window.addEventListener('mousemove', updateCursorPosition);
    
    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
    };
  }, [cursorIcon]);

  // Handle click on canvas to deselect buttons
  useEffect(() => {
    const handleCanvasClick = (e: MouseEvent) => {
      // Check if the click is outside the toolbar
      const toolbar = document.querySelector('.piece-toolbar');
      if (toolbar && !toolbar.contains(e.target as Node) && selectedButton) {
        setSelectedButton(null);
        setCursorIcon(null);
      }
    };

    window.addEventListener('click', handleCanvasClick);
    
    return () => {
      window.removeEventListener('click', handleCanvasClick);
    };
  }, [selectedButton]);

  return (
    <>
      {cursorIcon && (
        <div 
          id="custom-cursor" 
          className="fixed z-[9999] pointer-events-none w-16 h-16 bg-background/80 rounded-md shadow-md border border-black flex items-center justify-center"
          style={{ left: 0, top: 0 }}
        >
          {cursorIcon}
        </div>
      )}
      
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white shadow-lg rounded-xl p-2 border border-border/40 piece-toolbar">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!spacePressed) {
                setPanningMode('pan');
                setSelectedButton(null);
                setCursorIcon(null);
              }
            }}
            className="relative focus:outline-0 h-10 w-10 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <PanningModeIndicator toggled={!isInGrabMode && selectedButton !== 'ai' && selectedButton !== 'pieces' && selectedButton !== 'logic' && selectedButton !== 'thought'} />
            <MousePointer className="w-6 h-6" />
            <span className="absolute bottom-0.5 right-0.5 text-xs font-bold opacity-60">1</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!spacePressed) {
                setPanningMode('grab');
                setSelectedButton(null);
                setCursorIcon(null);
              }
            }}
            className="relative focus:outline-0 h-10 w-10 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <PanningModeIndicator toggled={isInGrabMode && selectedButton !== 'ai' && selectedButton !== 'pieces' && selectedButton !== 'logic' && selectedButton !== 'thought'} />
            <Hand className="w-6 h-6" />
            <span className="absolute bottom-0.5 right-0.5 text-xs font-bold opacity-60">2</span>
          </Button>
        </div>

        <div className="w-px h-8 bg-border/60 mx-2" />

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleButtonClick('ai')}
            className={cn(
              "h-10 px-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5 relative",
              { "bg-primary/15": selectedButton === 'ai' }
            )}
          >
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="font-medium">AI</span>
            <span className="absolute bottom-0.5 right-1.5 text-xs font-bold opacity-60">3</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleButtonClick('pieces')}
            className={cn(
              "h-10 px-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5 relative",
              { "bg-primary/15": selectedButton === 'pieces' }
            )}
          >
            <Puzzle className="w-6 h-6 text-blue-500" />
            <span className="font-medium">Pieces</span>
            <span className="absolute bottom-0.5 right-1.5 text-xs font-bold opacity-60">4</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleButtonClick('logic')}
            className={cn(
              "h-10 px-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5 relative",
              { "bg-primary/15": selectedButton === 'logic' }
            )}
          >
            <GitBranch className="w-6 h-6 text-green-500" />
            <span className="font-medium">Logic</span>
            <span className="absolute bottom-0.5 right-1.5 text-xs font-bold opacity-60">5</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleButtonClick('thought')}
            className={cn(
              "h-10 px-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5 relative",
              { "bg-primary/15": selectedButton === 'thought' }
            )}
          >
            <Lightbulb className="w-6 h-6 text-purple-500" />
            <span className="font-medium">Thought</span>
            <span className="absolute bottom-0.5 right-1.5 text-xs font-bold opacity-60">6</span>
          </Button>
        </div>
      </div>
    </>
  );
}; 