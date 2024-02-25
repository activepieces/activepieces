import { EntityAttributeType } from './constants';

export type EntityAttributeResponse = {
  '@odata.context': string;
  value: {
    '@odata.type': string;
    AttributeType: EntityAttributeType;
    LogicalName: string;
    MetadataId: string;
    IsValidForCreate: boolean;
    IsPrimaryName: boolean;
    Description: {
      UserLocalizedLabel: {
        Label: string;
        LanguageCode: number;
        IsManaged: boolean;
        MetadataId: string;
        HasChanged: boolean;
      } | null;
    } | null;
    DisplayName: {
      UserLocalizedLabel: {
        Label: string;
        LanguageCode: number;
        IsManaged: boolean;
        MetadataId: string;
        HasChanged: boolean;
      } | null;
    } | null;
  }[];
};

export type EntityAttributeOptionsResponse = {
  '@odata.context': string;
  LogicalName: string;
  MetadataId: string;
  OptionSet: {
    MetadataId: string;
    Options: {
      Value: number;
      Label: {
        UserLocalizedLabel: {
          Label: string;
          LanguageCode: number;
          IsManaged: boolean;
          MetadataId: string;
          HasChanged: boolean;
        };
      };
    }[];
  } | null;
  GlobalOptionSet: {
    MetadataId: string;
    Options: {
      Value: number;
      Label: {
        UserLocalizedLabel: {
          Label: string;
          LanguageCode: number;
          IsManaged: boolean;
          MetadataId: string;
          HasChanged: boolean;
        };
      };
    }[];
  } | null;
};
