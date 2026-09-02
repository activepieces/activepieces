import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import { LocalesEnum } from "@activepieces/core-utils";
import { PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from "@activepieces/core-piece-types";
import { ContextVersion } from "./context/versioning";
import type { OutputSchema } from "./output-schema";

export type I18nForPiece = Partial<Record<LocalesEnum, Record<string, string>>> | undefined

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
  deprecated?: boolean;
  i18n?: Partial<Record<LocalesEnum, Record<string, string>>>
  // this method didn't exist in older version
  getContextInfo: (() => { version: ContextVersion }) | undefined;
}

export type Audience = 'human' | 'ai' | 'both'

export type AiMetadata = {
  description?: string;
  idempotent?: boolean;
}

export type ActionClassification = 'READ' | 'SEARCH' | 'WRITE' | 'DESTRUCTIVE'

export const READ_ONLY_CLASSIFICATIONS: readonly ActionClassification[] = ['READ', 'SEARCH']

export const isReadOnlyClassification = (classification: ActionClassification | undefined): boolean =>
  classification !== undefined && READ_ONLY_CLASSIFICATIONS.includes(classification)

export type PropertyGroupDisplay = 'tabs' | 'section' | 'summary' | 'builder' | 'footer'

export type PropertyGroup = {
  key: string;
  display: PropertyGroupDisplay;
  label?: string;
  description?: string;
  icon?: string;
  props: string[];
}

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

export type TriggerBase = Omit<ActionBase, 'audience'> & {
  type: TriggerStrategy;
  sampleData: unknown,
  handshakeConfiguration?: WebhookHandshakeConfiguration;
  renewConfiguration?: WebhookRenewConfiguration;
  testStrategy: TriggerTestStrategy;
};

export type PieceMetadata = Omit<PieceBase, 'getContextInfo'> & {
  actions: Record<string, ActionBase>;
  triggers: Record<string, TriggerBase>;
  // this property didn't exist in older version
  contextInfo: { version: ContextVersion } | undefined;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
  suggestedActions?: ActionBase[];
  suggestedTriggers?: TriggerBase[];
}

type PiecePackageMetadata = {
  projectUsage: number;
  pieceType: PieceType;
  packageType: PackageType;
  platformId?: string;
  archiveId?: string;
}

export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata

export type PieceMetadataModelSummary = PieceMetadataSummary & PiecePackageMetadata;

export type PiecePackageInformation = {
  name: string;
  version: string;
}
