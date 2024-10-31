import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Fullscreen, Minus, Plus, RotateCw } from 'lucide-react';
import { useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { flowUtilConsts } from './consts';
import { flowCanvasUtils } from './flow-canvas-utils';
import { ApNode } from './types';

const duration = 200;
const CanvasControls = ({
  builderNavbarHeight,
}: {
  builderNavbarHeight: number;
}) => {
  const { zoomIn, zoomOut, zoomTo, setViewport, getNodes } = useReactFlow();
  const handleZoomIn = useCallback(() => {
    zoomIn({
      duration,
    });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({
      duration,
    });
  }, [zoomOut]);

  const handleZoomReset = useCallback(() => {
    zoomTo(1, { duration });
  }, [zoomTo]);

  const handleFitToView = useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) return;
    const graphHeight = flowCanvasUtils.calculateGraphBoundingBox({
      nodes: nodes as ApNode[],
      edges: [],
    }).height;
    const zoomRatio = Math.min(
      Math.max((window.innerHeight - builderNavbarHeight) / graphHeight, 0.9),
      1.25,
    );
    setViewport(
      {
        x:
          window.innerWidth / 2 -
          (flowUtilConsts.AP_NODE_SIZE.STEP.width * zoomRatio) / 2,
        y: nodes[0].position.y + 100 * zoomRatio,
        zoom: zoomRatio,
      },
      {
        duration,
      },
    );
  }, [getNodes, setViewport]);
  useEffect(() => {
    handleFitToView();
  }, []);
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
