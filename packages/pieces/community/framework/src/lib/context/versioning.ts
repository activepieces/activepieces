import { ActionContext } from ".";

export enum ContextVersion {
    V1 = '1'
}
export const LATEST_CONTEXT_VERSION = ContextVersion.V1;

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion }: MakeActionContextBackwardCompatibleParams): ActionContext {
        switch (contextVersion) {
            case undefined:
                {
                    return {
                        ...context,
                        serverUrl: context.server.publicUrl,
                    } as unknown as ActionContext
                }
            case ContextVersion.V1:
                return context;
        }
    }
}

type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext;
    contextVersion: ContextVersion | undefined;
}

