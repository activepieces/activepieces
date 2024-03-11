import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration, TriggerStrategy, WebhookHandshakeConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import { Type } from "@sinclair/typebox";
import { PieceCategory, ProjectId, TriggerTestStrategy } from "@activepieces/shared";

export const PieceBase = Type.Object({
  id: Type.Optional(Type.String()),
  name: Type.String(),
  displayName: Type.String(),
  logoUrl: Type.String(),
  description: Type.String(),
  projectId: Type.Optional(Type.String()),
  authors: Type.Array(Type.String()),
  platformId: Type.Optional(Type.String()),
  directoryPath: Type.Optional(Type.String()),
  auth: Type.Optional(PieceAuthProperty),
  version: Type.String(),
  categories: Type.Optional(Type.Array(Type.Enum(PieceCategory))),
  minimumSupportedRelease: Type.Optional(Type.String()),
  maximumSupportedRelease: Type.Optional(Type.String()),
})

export type PieceBase = {
  id?: string;
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  projectId?: ProjectId;
  platformId?: string;
  authors: string[],
  directoryPath?: string;
  auth?: PieceAuthProperty;
  version: string;
  categories?: PieceCategory[];
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
}

export const ActionBase = Type.Object({
  name: Type.String(),
  displayName: Type.String(),
  description: Type.String(),
  props: PiecePropertyMap,
  requireAuth: Type.Boolean(),
  errorHandlingOptions: Type.Optional(ErrorHandlingOptionsParam),
})

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  props: PiecePropertyMap,
  requireAuth: boolean;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
}

export const TriggerBase = Type.Composite([
  Type.Omit(ActionBase, ["requireAuth"]),
  Type.Object({
    type: Type.Enum(TriggerStrategy),
    sampleData: Type.Unknown(),
    handshakeConfiguration: Type.Optional(WebhookHandshakeConfiguration),
    renewConfiguration: Type.Optional(WebhookRenewConfiguration),
    testStrategy: Type.Enum(TriggerTestStrategy),
  })
])
export type TriggerBase = Omit<ActionBase, "requireAuth"> & {
  type: TriggerStrategy;
  sampleData: unknown,
  handshakeConfiguration?: WebhookHandshakeConfiguration;
  renewConfiguration?: WebhookRenewConfiguration;
  testStrategy: TriggerTestStrategy;
};

export const PieceMetadata = Type.Composite([
  PieceBase,
  Type.Object({
    actions: Type.Record(Type.String(), ActionBase),
    triggers: Type.Record(Type.String(), TriggerBase),
  })
])

export type PieceMetadata = PieceBase & {
  actions: Record<string, ActionBase>;
  triggers: Record<string, TriggerBase>;
};

export const PieceMetadataSummary = Type.Composite([
  Type.Omit(PieceMetadata, ["actions", "triggers"]),
  Type.Object({
    actions: Type.Number(),
    triggers: Type.Number(),
    suggestedActions: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      displayName: Type.String(),
    }))),
    suggestedTriggers: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      displayName: Type.String(),
    }))),
  })
])
export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
  suggestedActions?: { name: string, displayName: string }[];
  suggestedTriggers?: { name: string, displayName: string }[];
}
