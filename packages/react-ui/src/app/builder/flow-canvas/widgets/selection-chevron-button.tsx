import { ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';

import { NODE_SELECTION_RECT_CLASS_NAME } from '../../builder-hooks';
import { SELECTION_RECT_CHEVRON_ATTRIBUTE } from '../utils/consts';

const showChevronNextToSelection = (targetDiv: HTMLElement) => {
  const container = document.createElement('div');
  targetDiv.appendChild(container);
  const root = createRoot(container);
  root.render(
    <Button
      variant="outline"
      size="icon"
      className="absolute top-0 -left-10 z-50"
      {...{ [`data-${SELECTION_RECT_CHEVRON_ATTRIBUTE}`]: true }}
      onClick={(e) => {
        const rightClickEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        e.target.dispatchEvent(rightClickEvent);
      }}
    >
      <ChevronDown className="w-4 h-4" />
    </Button>,
  );
  return root;
};

export const useShowChevronNextToSelection = () => {
  useEffect(() => {
    let root: ReturnType<typeof createRoot> | null = null;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(NODE_SELECTION_RECT_CLASS_NAME)
          ) {
            root = showChevronNextToSelection(node.children[0] as HTMLElement);
          }
        });
        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(NODE_SELECTION_RECT_CLASS_NAME)
          ) {
            if (root) {
              root.unmount();
              root = null;
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
      // Unmount all roots on cleanup
      if (root) {
        root.unmount();
      }
    };
  }, []);
};
