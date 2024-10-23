import React from 'react';
import { Button } from '../../../components/ui/button';
import { t } from 'i18next';
import { useBuilderStateContext } from '../builder-hooks';
import {
  flowHelper,
  FlowOperationType,
  RouterAction,
} from '../../../../../shared/src';

export const RouterSettings = React.memo(
  ({ readonly }: { readonly: boolean }) => {
    const [step, applyOperation] = useBuilderStateContext((state) => [
      flowHelper.getStep(
        state.flowVersion,
        state.selectedStep!,
      )! as RouterAction,
      state.applyOperation,
    ]);

    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            applyOperation(
              {
                type: FlowOperationType.UPDATE_ACTION,
                request: {
                  ...step,
                  addBranchIndex: step.settings.branches.length,
                },
              },
              () => {},
            );
          }}
        >
          {t('Add Branch')}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            applyOperation(
              {
                type: FlowOperationType.UPDATE_ACTION,
                request: {
                  ...step,
                  deleteBranchIndex: step.settings.branches.length - 1,
                },
              },
              () => {},
            );
          }}
        >
          {t('Delete Branch')}
        </Button>
      </>
    );
  },
);
