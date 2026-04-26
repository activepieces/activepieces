import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import { z } from "zod";
import { LocalesEnum, PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from "@activepieces/shared";
import { ContextVersion } from "./context/versioning";
import { OutputDisplayHints } from "./output-display-hints";

const I18nForPiece = z.record(z.string(), z.record(z.string(), z.string())).optional();
export type I18nForPiece = Partial<Record<LocalesEnum, Record<string, string>>> | undefined
export const PieceBase = z.object({
  id: z.string().optional(),
  name: z.string(),
  displayName: z.string(),
  logoUrl: z.string(),
  description: z.string(),
  authors: z.array(z.string()),
  platformId: z.string().optional(),
  directoryPath: z.string().optional(),
  auth: z.union([PieceAuthProperty, z.array(PieceAuthProperty)]).optional(),
  version: z.string(),
  categories: z.array(z.nativeEnum(PieceCategory)).optional(),
  minimumSupportedRelease: z.string().optional(),
  maximumSupportedRelease: z.string().optional(),
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


export const ActionBase = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  props: PiecePropertyMap,
  requireAuth: z.boolean(),
  errorHandlingOptions: ErrorHandlingOptionsParam.optional(),
  outputDisplayHints: OutputDisplayHints.optional(),
})

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  props: PiecePropertyMap,
  requireAuth: boolean;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
  outputDisplayHints?: OutputDisplayHints;
}

export const TriggerBase = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  props: PiecePropertyMap,
  errorHandlingOptions: ErrorHandlingOptionsParam.optional(),
  type: z.nativeEnum(TriggerStrategy),
  sampleData: z.unknown(),
  handshakeConfiguration: z.custom<WebhookHandshakeConfiguration>().optional(),
  renewConfiguration: WebhookRenewConfiguration.optional(),
  testStrategy: z.nativeEnum(TriggerTestStrategy),
  outputDisplayHints: OutputDisplayHints.optional(),
})
export type TriggerBase = ActionBase & {
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
  suggestedActions: z.array(TriggerBase).optional(),
  suggestedTriggers: z.array(ActionBase).optional(),
})
export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
  suggestedActions?: ActionBase[];
  suggestedTriggers?: TriggerBase[];
}


const PiecePackageMetadata = z.object({
  projectUsage: z.number(),
  tags: z.array(z.string()).optional(),
  pieceType: z.nativeEnum(PieceType),
  packageType: z.nativeEnum(PackageType),
  platformId: z.string().optional(),
  archiveId: z.string().optional(),
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
