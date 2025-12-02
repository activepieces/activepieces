import { ActionContext } from ".";
import { InputPropertyMap, PieceAuthProperty } from "../property";

export enum ContextVersion {
    V1 = '1'
}
export const LATEST_CONTEXT_VERSION = ContextVersion.V1;

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion }: MakeActionContextBackwardCompatibleParams): ActionContext<PieceAuthProperty,InputPropertyMap> {
        switch (contextVersion) {
            case undefined:
                return migrateActionContextV1ToV0(context);
            case ContextVersion.V1:
                return context;
        }
    }
}

function migrateActionContextV1ToV0(context: ActionContext<PieceAuthProperty,InputPropertyMap>): ActionContext<PieceAuthProperty,InputPropertyMap> {
    return {
        ...context,
        serverUrl: context.server.publicUrl,
    } as unknown as ActionContext<PieceAuthProperty,InputPropertyMap>
}

type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext<PieceAuthProperty,InputPropertyMap>;
    contextVersion: ContextVersion | undefined;
}

