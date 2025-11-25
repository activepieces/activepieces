import { ActionContext } from ".";

export enum ContextVersion {
    V1 = '1'
}

export const LATEST_CONTEXT_VERSION = ContextVersion.V1;

function makeActionContextBackwardCompatible({context, serverUrl, contextVersion}: MakeActionContextBackwardCompatibleParams): ActionContext {
    switch (contextVersion) {
        case undefined:
            {
                return {
                    ...context,
                    serverUrl,
                } as unknown as ActionContext
            }
        case ContextVersion.V1:
            return context;
    }
}

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible,
}
type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext;
    serverUrl: string;
    contextVersion: ContextVersion | undefined;
}

