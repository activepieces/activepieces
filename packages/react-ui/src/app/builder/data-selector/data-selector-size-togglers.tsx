import { t } from 'i18next';
import { ExpandIcon, MinusIcon, PanelRightDashedIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Button } from '../../../components/ui/button';
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
      'text-outline': state === btnState,
      'text-outline opacity-50': state !== btnState,
    });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={buttonClassName(DataSelectorSizeState.EXPANDED)}
            onClick={() => handleClick(DataSelectorSizeState.EXPANDED)}
            variant="basic"
          >
            <ExpandIcon className="size-5"></ExpandIcon>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Expand')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={buttonClassName(DataSelectorSizeState.DOCKED)}
            onClick={() => handleClick(DataSelectorSizeState.DOCKED)}
            variant="basic"
          >
            <PanelRightDashedIcon className="size-5"></PanelRightDashedIcon>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Dock')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={buttonClassName(DataSelectorSizeState.COLLAPSED)}
            onClick={() => handleClick(DataSelectorSizeState.COLLAPSED)}
            variant="basic"
          >
            <MinusIcon className="size-5"></MinusIcon>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Minimize')}</TooltipContent>
      </Tooltip>
    </>
  );
};
