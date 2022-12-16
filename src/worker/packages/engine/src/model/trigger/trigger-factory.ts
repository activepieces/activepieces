import {createAction} from "../action/action-factory";
import {ComponentTrigger, ComponentTriggerSettings} from "./types/component-trigger";
import {TriggerMetadata, TriggerStepType} from "./trigger-metadata";

export function createTrigger(jsonData: any): TriggerMetadata {
  try {
    switch (jsonData['type']) {
      case 'COMPONENT':
        return new ComponentTrigger(
            ComponentTriggerSettings.deserialize(jsonData['settings']),
          TriggerStepType.COMPONENT,
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      default:
        return new TriggerMetadata(
            TriggerStepType.OTHER,
            !jsonData['nextAction']
                ? undefined
                : createAction(jsonData['nextAction'])
        );
    }
  } catch (e) {
    throw new Error(`Trigger creation failed: ${(e as Error).message}`);
  }
}
