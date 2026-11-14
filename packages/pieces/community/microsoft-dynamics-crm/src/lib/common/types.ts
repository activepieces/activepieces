import { EntityAttributeType } from './constants';

type LocalizedLabel = {
  UserLocalizedLabel?: {
    Label?: string | null;
  } | null;
} | null;

type OptionMetadata = {
  Value: number;
  State?: number;
  Label?: LocalizedLabel;
};

type OptionSetMetadata = {
  Options?: OptionMetadata[];
} | null;

export type EntityDefinition = {
  LogicalName: string;
  EntitySetName: string | null;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string | null;
  DisplayName?: LocalizedLabel;
  IsCustomizable?: { Value?: boolean } | null;
  HasNotes?: boolean;
  HasActivities?: boolean;
};

export type EntityTypeResponse = {
  value: EntityDefinition[];
};

export type EntityTypeAttributesResponse = {
  value: EntityDefinition[];
};

export type EntityAttribute = {
  AttributeType: EntityAttributeType;
  LogicalName: string;
  AttributeOf?: string | null;
  IsValidForCreate?: boolean;
  IsValidForUpdate?: boolean;
  IsValidForRead?: boolean;
  IsPrimaryName?: boolean;
  RequiredLevel?: { Value?: string } | null;
  Description?: LocalizedLabel;
  DisplayName?: LocalizedLabel;
};

export type EntityAttributeResponse = {
  value: EntityAttribute[];
};

export type EntityAttributeOptionsResponse = {
  LogicalName?: string;
  OptionSet?: OptionSetMetadata;
  GlobalOptionSet?: OptionSetMetadata;
};

export type EntityOptionAttributesResponse = {
  value: EntityAttributeOptionsResponse[];
};

export type ManyToOneRelationship = {
  SchemaName: string;
  ReferencingAttribute: string;
  ReferencingEntityNavigationPropertyName: string;
  ReferencedEntity: string;
};

export type OneToManyRelationship = {
  SchemaName: string;
  ReferencingEntity: string;
  ReferencingAttribute: string;
  ReferencedEntityNavigationPropertyName: string;
};

export type ManyToManyRelationship = {
  SchemaName: string;
  Entity1LogicalName: string;
  Entity2LogicalName: string;
  Entity1NavigationPropertyName: string;
  Entity2NavigationPropertyName: string;
};

export type OptionValue = {
  label: string;
  value: number;
};

export type CollectionRelationship = {
  navigationProperty: string;
  targetEntity: string;
  schemaName: string;
  kind: 'one_to_many' | 'many_to_many';
};

export type RecordPage = {
  records: Record<string, unknown>[];
  nextLink: string | null;
  hasMore: boolean;
};

export type WhoAmIResponse = {
  UserId: string;
  BusinessUnitId: string;
  OrganizationId: string;
};

export type DynamicsAuthValue = {
  access_token: string;
  props?: Record<string, unknown>;
};

export type { OptionMetadata, LocalizedLabel };
