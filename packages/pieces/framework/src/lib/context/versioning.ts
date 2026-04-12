import { ActionContext } from ".";
import { InputPropertyMap, PieceAuthProperty } from "../property";

export enum ContextVersion {
    V1 = '1',
    V2 = '2',
}
//bump these two constants after creating a new context version
export const LATEST_CONTEXT_VERSION = ContextVersion.V2;
export const MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION = '0.82.0';

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion }: MakeActionContextBackwardCompatibleParams): ActionContext<PieceAuthProperty,InputPropertyMap> {
        switch (contextVersion) {
            case undefined:
                return migrateActionContextV1ToV0(context);
            case ContextVersion.V1:
                return context;
            case ContextVersion.V2:
                return stripLegacyMethodsForV2(context);
        }
    }
}

function migrateActionContextV1ToV0(context: ActionContext<PieceAuthProperty,InputPropertyMap>): ActionContext<PieceAuthProperty,InputPropertyMap> {
    return {
        ...context,
        serverUrl: context.server.publicUrl,
    } as unknown as ActionContext<PieceAuthProperty,InputPropertyMap>
}

function stripLegacyMethodsForV2(context: ActionContext<PieceAuthProperty,InputPropertyMap>): ActionContext<PieceAuthProperty,InputPropertyMap> {
    const { generateResumeUrl: _generateResumeUrl, ...rest } = context
    const { pause: _pause, ...runWithoutPause } = context.run
    return {
        ...rest,
        run: runWithoutPause,
    }
}

type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext<PieceAuthProperty,InputPropertyMap>;
    contextVersion: ContextVersion | undefined;
}
