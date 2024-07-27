import { Button } from '../../../components/ui/button';
import { StepPathWithName } from '../builder-hooks';

export const TestStepSection = (
  stepName: string,
  selectStep: (path: StepPathWithName) => void,
) => {
  const isTrigger = stepName === 'trigger';

  return (
    <div className="flex flex-col gap-3 select-none text-center px-12 py-2 flex-grow items-center justify-center ">
      <div>
        {isTrigger
          ? 'This trigger needs to have data loaded from your account, to use as sample data.'
          : 'This step needs to be tested in order to view its data.'}
      </div>
      <div>
        <Button
          onClick={() => {
            selectStep({ path: [], stepName });
          }}
          variant="default"
          size="default"
        >
          {isTrigger ? 'Go to Trigger' : 'Go to Step'}{' '}
        </Button>
      </div>
    </div>
  );
};
