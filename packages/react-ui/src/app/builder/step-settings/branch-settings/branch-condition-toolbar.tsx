import { Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';

type BranchSingleConditionToolbarProps = {
  deleteClick?: () => void;
  onAnd: () => void;
  onOr: () => void;
  showOr: boolean;
  showDelete: boolean;
  showAnd: boolean;
};
const BranchSingleConditionToolbar = (
  props: BranchSingleConditionToolbarProps,
) => {
  return (
    <div className="flex gap-2 text-center justify-center">
      {props.showAnd && (
        <Button variant="outline" size="sm" onClick={props.onAnd}>
          + And
        </Button>
      )}

      {props.showOr && (
        <Button variant="outline" size="sm" onClick={props.onOr}>
          + Or
        </Button>
      )}
      {props.showDelete && (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={props.deleteClick}
        >
          <Trash className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

BranchSingleConditionToolbar.displayName = 'BranchSingleConditionToolbar';
export { BranchSingleConditionToolbar };
