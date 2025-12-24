import { Static } from '@sinclair/typebox';
import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { ExtractPieceAuthPropertyTypeForMethods, PieceAuthProperty } from '../property/authentication';
export type ActionRunner<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty, ActionProps extends InputPropertyMap = InputPropertyMap> = (ctx: ActionContext<PieceAuth, ActionProps>) => Promise<unknown | void>;
export declare const ErrorHandlingOptionsParam: import("@sinclair/typebox").TObject<{
    retryOnFailure: import("@sinclair/typebox").TObject<{
        defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>;
    continueOnFailure: import("@sinclair/typebox").TObject<{
        defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>;
}>;
export type ErrorHandlingOptionsParam = Static<typeof ErrorHandlingOptionsParam>;
type CreateActionParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, ActionProps extends InputPropertyMap> = {
    /**
     * A dummy parameter used to infer {@code PieceAuth} type
     */
    name: string;
    /**
     * this parameter is used to infer the type of the piece auth value in run and test methods
     */
    auth?: PieceAuth;
    displayName: string;
    description: string;
    props: ActionProps;
    run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>;
    test?: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>;
    requireAuth?: boolean;
    errorHandlingOptions?: ErrorHandlingOptionsParam;
};
export declare class IAction<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any, ActionProps extends InputPropertyMap = InputPropertyMap> implements ActionBase {
    readonly name: string;
    readonly displayName: string;
    readonly description: string;
    readonly props: ActionProps;
    readonly run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>;
    readonly test: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>;
    readonly requireAuth: boolean;
    readonly errorHandlingOptions: ErrorHandlingOptionsParam;
    constructor(name: string, displayName: string, description: string, props: ActionProps, run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>, test: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>, requireAuth: boolean, errorHandlingOptions: ErrorHandlingOptionsParam);
}
export type Action<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any, ActionProps extends InputPropertyMap = any> = IAction<PieceAuth, ActionProps>;
export declare const createAction: <PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty, ActionProps extends InputPropertyMap = any>(params: CreateActionParams<PieceAuth, ActionProps>) => IAction<PieceAuth, ActionProps>;
export {};
