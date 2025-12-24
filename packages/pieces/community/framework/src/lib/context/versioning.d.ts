import { ActionContext } from ".";
import { InputPropertyMap, PieceAuthProperty } from "../property";
export declare enum ContextVersion {
    V1 = "1"
}
export declare const LATEST_CONTEXT_VERSION = ContextVersion.V1;
export declare const MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION = "0.73.0";
export declare const backwardCompatabilityContextUtils: {
    makeActionContextBackwardCompatible({ context, contextVersion }: MakeActionContextBackwardCompatibleParams): ActionContext<PieceAuthProperty, InputPropertyMap>;
};
type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext<PieceAuthProperty, InputPropertyMap>;
    contextVersion: ContextVersion | undefined;
};
export {};
