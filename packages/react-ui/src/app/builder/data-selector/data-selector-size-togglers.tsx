import { ExpandIcon, MinusIcon, PanelRightDashedIcon } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

export enum DataSelectorSizeState {
  EXPANDED,
  COLLAPSED,
  DOCKED,
}

type DataSelectorSizeTogglersPorps = {
  state: DataSelectorSizeState;
  setListSizeState: (state: DataSelectorSizeState) => void;
};

export const DataSelectorSizeTogglers = ({
  state,
  setListSizeState: setDataSelectorSizeState,
}: DataSelectorSizeTogglersPorps) => {
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
      <Button
        size="icon"
        className={buttonClassName(DataSelectorSizeState.EXPANDED)}
        onClick={() => handleClick(DataSelectorSizeState.EXPANDED)}
        variant="basic"
      >
        <ExpandIcon></ExpandIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(DataSelectorSizeState.DOCKED)}
        onClick={() => handleClick(DataSelectorSizeState.DOCKED)}
        variant="basic"
      >
        <PanelRightDashedIcon></PanelRightDashedIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(DataSelectorSizeState.COLLAPSED)}
        onClick={() => handleClick(DataSelectorSizeState.COLLAPSED)}
        variant="basic"
      >
        <MinusIcon></MinusIcon>
      </Button>
    </>
  );
};
