import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Fullscreen, Minus, Plus, RotateCw } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const CanvasControls = () => {
  const reactFlow = useReactFlow();

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({
      duration: 200,
    });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({
      duration: 200,
    });
  }, [reactFlow]);

  const handleZoomReset = useCallback(() => {
    reactFlow.zoomTo(1);
  }, [reactFlow]);

  const handleFitToView = useCallback(() => {
    reactFlow.fitView({
      nodes: reactFlow.getNodes().slice(0, 5),
      minZoom: 0.5,
      maxZoom: 1.2,
      duration: 300,
    });
  }, [reactFlow]);

  return (
    <div className="bg-secondary absolute left-[10px] bottom-[10px] z-50 flex flex-row">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomReset}>
            <RotateCw className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Reset Zoom')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomIn}>
            <Plus className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Zoom In')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomOut}>
            <Minus className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Zoom Out')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleFitToView}>
            <Fullscreen className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Fit to View')}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export { CanvasControls };
