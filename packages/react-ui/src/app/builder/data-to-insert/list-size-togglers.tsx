import { ExpandIcon, MinusIcon, PanelRightDashedIcon } from 'lucide-react';

import { Button } from '../../../components/ui/button';

export enum ListSizeState {
  EXPANDED,
  COLLAPSED,
  DOCKED,
}

type ListSizeTogglersPorps = {
  state: ListSizeState;
  setListSizeState: (state: ListSizeState) => void;
};

export const ListSizeTogglers = ({
  state,
  setListSizeState,
}: ListSizeTogglersPorps) => {
  const handleClick = (newState: ListSizeState) => {
    setListSizeState(newState);
  };
  const buttonClassName = (btnState: ListSizeState) =>
    state === btnState ? 'text-outline' : 'text-outline opacity-50';
  return (
    <>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.EXPANDED)}
        onClick={() => handleClick(ListSizeState.EXPANDED)}
        variant="basic"
      >
        <ExpandIcon></ExpandIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.DOCKED)}
        onClick={() => handleClick(ListSizeState.DOCKED)}
        variant="basic"
      >
        <PanelRightDashedIcon></PanelRightDashedIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.COLLAPSED)}
        onClick={() => handleClick(ListSizeState.COLLAPSED)}
        variant="basic"
      >
        <MinusIcon></MinusIcon>
      </Button>
    </>
  );
};
