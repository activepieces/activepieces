import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import { Static, Type } from "@sinclair/typebox";
import { LocalesEnum, PackageType, PieceCategory, PieceType, ProjectId, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from "@activepieces/shared";

const I18nForPiece =  Type.Optional(Type.Partial(Type.Record(Type.Enum(LocalesEnum), Type.Record(Type.String(), Type.String()))));
export type I18nForPiece = Static<typeof I18nForPiece>
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
  i18n:I18nForPiece,
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
  i18n?: Partial<Record<LocalesEnum, Record<string, string>>>
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
export type TriggerBase = ActionBase & {
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
    suggestedActions: Type.Optional(Type.Array(TriggerBase)),
    suggestedTriggers: Type.Optional(Type.Array(ActionBase)),
  })
])
export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
  suggestedActions?: ActionBase[];
  suggestedTriggers?: TriggerBase[];
}


const PiecePackageMetadata = Type.Object({
  projectUsage: Type.Number(),
  tags: Type.Optional(Type.Array(Type.String())),
  pieceType: Type.Enum(PieceType),
  packageType: Type.Enum(PackageType),
  archiveId: Type.Optional(Type.String()),
})
type PiecePackageMetadata = Static<typeof PiecePackageMetadata>

export const PieceMetadataModel = Type.Composite([
  PieceMetadata,
  PiecePackageMetadata
])
export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata

export const PieceMetadataModelSummary = Type.Composite([
  PieceMetadataSummary,
  PiecePackageMetadata
])
export type PieceMetadataModelSummary = PieceMetadataSummary & PiecePackageMetadata;