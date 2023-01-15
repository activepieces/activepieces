import { Static, Type } from "@sinclair/typebox";
import {Config, ConfigType} from "../config";

export const ConfigValidation = Type.Union([
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.CHECKBOX),
        value: Type.Boolean(),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.SHORT_TEXT),
        value: Type.String(),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.LONG_TEXT),
        value: Type.String(),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.NUMBER),
        value: Type.Number(),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.DICTIONARY),
        value: Type.Object({}),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.CLOUD_OAUTH2),
        settings: Type.Object({}),
        value: Type.Object({}),
    }),
    Type.Object({
        key: Type.String(),
        type: Type.Literal(ConfigType.OAUTH2),
        settings: Type.Object({}),
        value: Type.Object({}),
    })
    
])

export const UpdateCollectionRequest = Type.Object({
    configs: Type.Array(ConfigValidation),
    displayName: Type.String({}),
});

export type UpdateCollectionRequest = Static<typeof UpdateCollectionRequest> & { configs: Config[]};
