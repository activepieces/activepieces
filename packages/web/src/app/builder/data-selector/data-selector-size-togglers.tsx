import { t } from 'i18next';
import { ExpandIcon, MinusIcon, PanelRightDashedIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '../../../lib/utils';

export enum DataSelectorSizeState {
  EXPANDED,
  COLLAPSED,
  DOCKED,
}

type DataSelectorSizeTogglersProps = {
  state: DataSelectorSizeState;
  setListSizeState: (state: DataSelectorSizeState) => void;
};

export const DataSelectorSizeTogglers = ({
  state,
  setListSizeState: setDataSelectorSizeState,
}: DataSelectorSizeTogglersProps) => {
  const handleClick = (newState: DataSelectorSizeState) => {
    setDataSelectorSizeState(newState);
  };

  const buttonClassName = (btnState: DataSelectorSizeState) =>
    cn('', {
      'opacity-50': state !== btnState,
    });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            className={buttonClassName(DataSelectorSizeState.EXPANDED)}
            onClick={() => handleClick(DataSelectorSizeState.EXPANDED)}
            variant="ghost"
          >
            <ExpandIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Expand')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            className={buttonClassName(DataSelectorSizeState.DOCKED)}
            onClick={() => handleClick(DataSelectorSizeState.DOCKED)}
            variant="ghost"
          >
            <PanelRightDashedIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Dock')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            className={buttonClassName(DataSelectorSizeState.COLLAPSED)}
            onClick={() => handleClick(DataSelectorSizeState.COLLAPSED)}
            variant="ghost"
          >
            <MinusIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Minimize')}</TooltipContent>
      </Tooltip>
    </>
  );
};
