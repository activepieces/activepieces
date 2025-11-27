import { ActionContext } from ".";

export enum ContextVersion {
    V1 = '1'
}
export const LATEST_CONTEXT_VERSION = ContextVersion.V1;

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion }: MakeActionContextBackwardCompatibleParams): ActionContext {
        switch (contextVersion) {
            case undefined:
                return migrateActionContextV1ToV0(context);
            case ContextVersion.V1:
                return context;
        }
    }
}

function migrateActionContextV1ToV0(context: ActionContext): ActionContext {
    return {
        ...context,
        serverUrl: context.server.publicUrl,
    } as unknown as ActionContext
}

type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext;
    contextVersion: ContextVersion | undefined;
}

