import { ActionContext, PauseHook } from ".";
import { InputPropertyMap, PieceAuthProperty } from "../property";

export enum ContextVersion {
    V1 = '1',
    V2 = '2',
}
//bump these two constants after creating a new context version
export const LATEST_CONTEXT_VERSION = ContextVersion.V2;
export const MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION = '0.82.0';

export const backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion, legacyHooks }: MakeActionContextBackwardCompatibleParams): ActionContext<PieceAuthProperty, InputPropertyMap> {
        switch (contextVersion) {
            case ContextVersion.V2:
                return context;
            case ContextVersion.V1:
                return addLegacyMethods({ context, legacyHooks });
            case undefined:
                return addLegacyMethodsAndServerUrl({ context, legacyHooks });
        }
    },
}

function addLegacyMethods({ context, legacyHooks }: { context: ActionContext<PieceAuthProperty, InputPropertyMap>, legacyHooks: LegacyHooks }): ActionContext<PieceAuthProperty, InputPropertyMap> {
    return {
        ...context,
        generateResumeUrl: legacyHooks.generateResumeUrl,
        run: {
            ...context.run,
            pause: legacyHooks.pause,
        },
    }
}

function addLegacyMethodsAndServerUrl({ context, legacyHooks }: { context: ActionContext<PieceAuthProperty, InputPropertyMap>, legacyHooks: LegacyHooks }): ActionContext<PieceAuthProperty, InputPropertyMap> {
    return {
        ...addLegacyMethods({ context, legacyHooks }),
        serverUrl: context.server.publicUrl,
    } as unknown as ActionContext<PieceAuthProperty, InputPropertyMap>
}

type LegacyHooks = {
    pause: PauseHook;
    generateResumeUrl: (params: { queryParams: Record<string, string>, sync?: boolean }) => string;
}

type MakeActionContextBackwardCompatibleParams = {
    context: ActionContext<PieceAuthProperty, InputPropertyMap>;
    contextVersion: ContextVersion | undefined;
    legacyHooks: LegacyHooks;
}
