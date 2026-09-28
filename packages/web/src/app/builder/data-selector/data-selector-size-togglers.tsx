import {
  ArrowExpandIcon,
  PanelRightDashedIcon,
  Remove01Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
            <HugeiconsIcon icon={ArrowExpandIcon} className="size-5" />
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
            <HugeiconsIcon icon={PanelRightDashedIcon} className="size-5" />
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
            <HugeiconsIcon icon={Remove01Icon} className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Minimize')}</TooltipContent>
      </Tooltip>
    </>
  );
};
