import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import * as z from "zod/mini";
import { LocalesEnum } from "@activepieces/core-utils";
import { PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from "@activepieces/core-piece-types";
import { ContextVersion } from "./context/versioning";
import type { OutputSchema } from "./output-schema";

const I18nForPiece = z.optional(z.record(z.string(), z.record(z.string(), z.string())));
export type I18nForPiece = Partial<Record<LocalesEnum, Record<string, string>>> | undefined
export const PieceBase = z.object({
  id: z.optional(z.string()),
  name: z.string(),
  displayName: z.string(),
  logoUrl: z.string(),
  description: z.string(),
  authors: z.array(z.string()),
  platformId: z.optional(z.string()),
  directoryPath: z.optional(z.string()),
  auth: z.optional(z.union([PieceAuthProperty, z.array(PieceAuthProperty)])),
  version: z.string(),
  categories: z.optional(z.array(z.enum(PieceCategory))),
  minimumSupportedRelease: z.optional(z.string()),
  maximumSupportedRelease: z.optional(z.string()),
  i18n: I18nForPiece,
})

export type PieceBase = {
  id?: string;
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  platformId?: string;
  authors: string[],
  directoryPath?: string;
  auth?: PieceAuthProperty | PieceAuthProperty[];
  version: string;
  categories?: PieceCategory[];
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
  i18n?: Partial<Record<LocalesEnum, Record<string, string>>>
  // this method didn't exist in older version
  getContextInfo: (() => { version: ContextVersion }) | undefined;
}


export const Audience = z.enum(['human', 'ai', 'both'])
export type Audience = z.infer<typeof Audience>

export const AiMetadata = z.object({
  description: z.optional(z.string()),
  idempotent: z.optional(z.boolean()),
})
export type AiMetadata = z.infer<typeof AiMetadata>

export const ActionClassification = z.enum(['READ', 'WRITE'])
export type ActionClassification = z.infer<typeof ActionClassification>

export const PropertyGroupDisplay = z.enum(['tabs', 'section', 'summary', 'builder', 'footer'])
export type PropertyGroupDisplay = z.infer<typeof PropertyGroupDisplay>

export const PropertyGroup = z.object({
  key: z.string(),
  display: PropertyGroupDisplay,
  label: z.optional(z.string()),
  description: z.optional(z.string()),
  icon: z.optional(z.string()),
  props: z.array(z.string()),
})
export type PropertyGroup = z.infer<typeof PropertyGroup>

export const ActionBase = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  props: PiecePropertyMap,
  propertyGroups: z.optional(z.array(PropertyGroup)),
  requireAuth: z.boolean(),
  errorHandlingOptions: z.optional(ErrorHandlingOptionsParam),
  outputSchema: z.optional(z.custom<OutputSchema>()),
  audience: z.optional(Audience),
  aiMetadata: z.optional(AiMetadata),
  classification: z.optional(ActionClassification),
})

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  props: PiecePropertyMap,
  propertyGroups?: PropertyGroup[];
  requireAuth: boolean;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
  outputSchema?: OutputSchema;
  audience?: Audience;
  aiMetadata?: AiMetadata;
  classification?: ActionClassification;
}

export const TriggerBase = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  props: PiecePropertyMap,
  propertyGroups: z.optional(z.array(PropertyGroup)),
  errorHandlingOptions: z.optional(ErrorHandlingOptionsParam),
  type: z.enum(TriggerStrategy),
  sampleData: z.unknown(),
  handshakeConfiguration: z.optional(z.custom<WebhookHandshakeConfiguration>()),
  renewConfiguration: z.optional(WebhookRenewConfiguration),
  testStrategy: z.enum(TriggerTestStrategy),
  outputSchema: z.optional(z.custom<OutputSchema>()),
  aiMetadata: z.optional(AiMetadata),
  classification: z.optional(ActionClassification),
})
export type TriggerBase = Omit<ActionBase, 'audience'> & {
  type: TriggerStrategy;
  sampleData: unknown,
  handshakeConfiguration?: WebhookHandshakeConfiguration;
  renewConfiguration?: WebhookRenewConfiguration;
  testStrategy: TriggerTestStrategy;
};

export const PieceMetadata = z.object({
  ...PieceBase.shape,
  actions: z.record(z.string(), ActionBase),
  triggers: z.record(z.string(), TriggerBase),
})

export type PieceMetadata = Omit<PieceBase, 'getContextInfo'> & {
  actions: Record<string, ActionBase>;
  triggers: Record<string, TriggerBase>;
  // this property didn't exist in older version
  contextInfo: { version: ContextVersion } | undefined;
};

export const PieceMetadataSummary = z.object({
  ...PieceBase.shape,
  actions: z.number(),
  triggers: z.number(),
  suggestedActions: z.optional(z.array(TriggerBase)),
  suggestedTriggers: z.optional(z.array(ActionBase)),
})
export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
  suggestedActions?: ActionBase[];
  suggestedTriggers?: TriggerBase[];
}


const PiecePackageMetadata = z.object({
  projectUsage: z.number(),
  pieceType: z.enum(PieceType),
  packageType: z.enum(PackageType),
  platformId: z.optional(z.string()),
  archiveId: z.optional(z.string()),
})
type PiecePackageMetadata = z.infer<typeof PiecePackageMetadata>

export const PieceMetadataModel = z.object({
  ...PieceMetadata.shape,
  ...PiecePackageMetadata.shape,
})
export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata

export const PieceMetadataModelSummary = z.object({
  ...PieceMetadataSummary.shape,
  ...PiecePackageMetadata.shape,
})
export type PieceMetadataModelSummary = PieceMetadataSummary & PiecePackageMetadata;

export const PiecePackageInformation = z.object({
  name: z.string(),
  version: z.string(),
})
export type PiecePackageInformation = z.infer<typeof PiecePackageInformation>
