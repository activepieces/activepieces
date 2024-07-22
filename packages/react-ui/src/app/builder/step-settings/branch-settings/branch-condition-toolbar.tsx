import { Button } from '@/components/ui/button';

type BranchSingleConditionToolbarProps = {
  onAnd: () => void;
  onOr: () => void;
  showOr: boolean;
  showAnd: boolean;
};
const BranchSingleConditionToolbar = (
  props: BranchSingleConditionToolbarProps,
) => {
  return (
    <div className="flex gap-2 text-center justify-start">
      {props.showAnd && (
        <Button variant="basic" size="sm" onClick={props.onAnd}>
          + And
        </Button>
      )}

      {props.showOr && (
        <Button variant="basic" size="sm" onClick={props.onOr}>
          + Or
        </Button>
      )}
    </div>
  );
};

BranchSingleConditionToolbar.displayName = 'BranchSingleConditionToolbar';
export { BranchSingleConditionToolbar };
