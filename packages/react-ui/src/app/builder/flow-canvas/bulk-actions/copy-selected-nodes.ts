import {
  Action,
  ActionType,
  StepLocationRelativeToParent,
  flowStructureUtil,
  removeAnySubsequentAction,
} from '@activepieces/shared';

import { BuilderState } from '../../builder-hooks';
import { EMPTY_STEP_PARENT_NAME } from '../utils/consts';

export const copySelectedNodes = ({
  selectedNodes,
  flowVersion,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion'>) => {
  const steps = selectedNodes
    .map((node) => flowStructureUtil.getStepOrThrow(node, flowVersion.trigger))
    .filter((step) => flowStructureUtil.isAction(step.type)) as Action[];
  const operationsToCopy = steps
    .map((step) => {
      if (!flowStructureUtil.isTrigger(step.type)) {
        const pathToStep = flowStructureUtil.findPathToStep(
          flowVersion.trigger,
          step.name,
        );
        const firstPreviousAction = pathToStep.reverse().find((s) => {
          return selectedNodes.findIndex((n) => n === s.name) > -1;
        });
        const stepWithoutChildren = removeAnySubsequentAction(step);

        if (firstPreviousAction) {
          const isPreviousStepTheParent = flowStructureUtil.isChildOf(
            firstPreviousAction,
            step.name,
          );

          if (isPreviousStepTheParent) {
            const branchIndex =
              firstPreviousAction.type !== ActionType.ROUTER
                ? undefined
                : firstPreviousAction.children.findIndex((c) =>
                    c
                      ? flowStructureUtil.isChildOf(c, step.name) ||
                        c.name === step.name
                      : false,
                  );

            return {
              action: stepWithoutChildren,
              parentStep: firstPreviousAction.name,
              stepLocationRelativeToParent:
                firstPreviousAction.type === ActionType.LOOP_ON_ITEMS
                  ? StepLocationRelativeToParent.INSIDE_LOOP
                  : StepLocationRelativeToParent.INSIDE_BRANCH,
              branchIndex,
            };
          }

          return {
            action: stepWithoutChildren,
            parentStep: firstPreviousAction.name,
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          };
        }

        return {
          action: stepWithoutChildren,
          parentStep: EMPTY_STEP_PARENT_NAME,
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        };
      }
    })
    .filter((operation) => operation !== undefined);
  navigator.clipboard.writeText(JSON.stringify(operationsToCopy));
};
