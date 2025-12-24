import { Trigger } from './trigger/trigger';
import { Action } from './action/action';
import { EventPayload, ParseEventResponse, PieceCategory } from '@activepieces/shared';
import { PieceBase, PieceMetadata } from './piece-metadata';
import { PieceAuthProperty } from './property/authentication';
import { ServerContext } from './context';
import { ContextVersion } from './context/versioning';
export declare class Piece<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty> implements Omit<PieceBase, 'version' | 'name'> {
    readonly displayName: string;
    readonly logoUrl: string;
    readonly authors: string[];
    readonly events: PieceEventProcessors | undefined;
    readonly categories: PieceCategory[];
    readonly auth?: PieceAuth;
    readonly minimumSupportedRelease: string;
    readonly maximumSupportedRelease?: string;
    readonly description: string;
    private readonly _actions;
    private readonly _triggers;
    getContextInfo: (() => {
        version: ContextVersion;
    }) | undefined;
    constructor(displayName: string, logoUrl: string, authors: string[], events: PieceEventProcessors | undefined, actions: Action[], triggers: Trigger[], categories: PieceCategory[], auth?: PieceAuth, minimumSupportedRelease?: string, maximumSupportedRelease?: string, description?: string);
    metadata(): BackwardCompatiblePieceMetadata;
    getAction(actionName: string): Action | undefined;
    getTrigger(triggerName: string): Trigger | undefined;
    actions(): Record<string, Action>;
    triggers(): Record<string, Trigger>;
}
export declare const createPiece: <PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined>(params: CreatePieceParams<PieceAuth>) => Piece<PieceAuth>;
type CreatePieceParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = {
    displayName: string;
    logoUrl: string;
    authors: string[];
    description?: string;
    auth: PieceAuth | undefined;
    events?: PieceEventProcessors;
    minimumSupportedRelease?: string;
    maximumSupportedRelease?: string;
    actions: Action[];
    triggers: Trigger[];
    categories?: PieceCategory[];
};
type PieceEventProcessors = {
    parseAndReply: (ctx: {
        payload: EventPayload;
        server: Omit<ServerContext, 'token' | 'apiUrl'>;
    }) => ParseEventResponse;
    verify: (ctx: {
        webhookSecret: string | Record<string, string>;
        payload: EventPayload;
        appWebhookUrl: string;
    }) => boolean;
};
type BackwardCompatiblePieceMetadata = Omit<PieceMetadata, 'name' | 'version' | 'authors' | 'i18n' | 'getContextInfo'> & {
    authors?: PieceMetadata['authors'];
    i18n?: PieceMetadata['i18n'];
};
export {};
