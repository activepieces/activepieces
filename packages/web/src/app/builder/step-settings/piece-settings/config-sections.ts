import { PieceProperty, PropertyGroup } from '@activepieces/pieces-framework';

function buildSections({
  propertyGroups,
  essentialProps,
  advancedPropNames,
  hasConnection,
  hasErrorHandling,
  hasTest,
}: BuildSectionsParams): ConfigSection[] {
  const pageGroups = (propertyGroups ?? []).filter(
    (group) => group.display === 'page',
  );
  const grouped = new Set(pageGroups.flatMap((group) => group.props));
  const essentialNames = Object.keys(essentialProps);
  const ungrouped = essentialNames.filter((name) => !grouped.has(name));

  const propertySections: ConfigSection[] =
    pageGroups.length > 0
      ? [
          ...pageGroups.map((group) => ({
            key: `group-${group.key}`,
            kind: 'properties' as const,
            label: group.label ?? group.key,
            description: group.description,
            icon: group.icon,
            propNames: group.props.filter((name) => !!essentialProps[name]),
          })),
          ...(ungrouped.length > 0
            ? [
                {
                  key: 'other',
                  kind: 'properties' as const,
                  label: 'Other Settings',
                  propNames: ungrouped,
                },
              ]
            : []),
        ]
      : essentialNames.length > 0
      ? [
          {
            key: 'configuration',
            kind: 'properties' as const,
            label: 'Configuration',
            propNames: essentialNames,
          },
        ]
      : [];

  return [
    ...(hasConnection
      ? [
          {
            key: 'connection',
            kind: 'connection' as const,
            label: 'Connection',
            description: 'Connect your account',
            propNames: ['auth'],
          },
        ]
      : []),
    ...propertySections,
    ...(advancedPropNames.length > 0 || hasErrorHandling
      ? [
          {
            key: 'advanced',
            kind: 'advanced' as const,
            label: 'Advanced',
            description: 'Additional settings (optional)',
            propNames: advancedPropNames,
          },
        ]
      : []),
    ...(hasTest
      ? [
          {
            key: 'test',
            kind: 'test' as const,
            label: 'Test',
            description: 'Test your step',
            propNames: [],
          },
        ]
      : []),
  ];
}

function isSectionRequired({
  section,
  props,
}: {
  section: ConfigSection;
  props: Record<string, PieceProperty>;
}): boolean {
  if (section.kind === 'connection') {
    return true;
  }
  return section.propNames.some((name) => props[name]?.required === true);
}

function requiredNamesOf({
  section,
  props,
}: {
  section: ConfigSection;
  props: Record<string, PieceProperty>;
}): string[] {
  if (section.kind === 'connection') {
    return ['auth'];
  }
  return section.propNames.filter((name) => props[name]?.required === true);
}

function usesNavigator({
  propertyGroups,
}: {
  propertyGroups: PropertyGroup[] | undefined;
}): boolean {
  return (
    (propertyGroups ?? []).filter((group) => group.display === 'page').length >=
    2
  );
}

export const configSectionUtils = {
  buildSections,
  isSectionRequired,
  requiredNamesOf,
  usesNavigator,
};

export type ConfigSectionKind =
  | 'connection'
  | 'properties'
  | 'advanced'
  | 'test';

export type ConfigSection = {
  key: string;
  kind: ConfigSectionKind;
  label: string;
  description?: string;
  icon?: string;
  propNames: string[];
};

type BuildSectionsParams = {
  propertyGroups: PropertyGroup[] | undefined;
  essentialProps: Record<string, PieceProperty>;
  advancedPropNames: string[];
  hasConnection: boolean;
  hasErrorHandling: boolean;
  hasTest: boolean;
};
