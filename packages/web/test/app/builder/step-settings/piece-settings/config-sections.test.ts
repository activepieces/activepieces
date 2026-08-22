import { Property, PropertyGroup } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';

import { configSectionUtils } from '@/app/builder/step-settings/piece-settings/config-sections';

const shortText = (displayName: string, required = false) =>
  Property.ShortText({ displayName, required });

describe('configSectionUtils.buildSections', () => {
  it('collapses an ungrouped action into one Configuration section', () => {
    const sections = configSectionUtils.buildSections({
      propertyGroups: undefined,
      essentialProps: { a: shortText('A'), b: shortText('B') },
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections.map((section) => section.key)).toEqual(['configuration']);
    expect(sections[0].propNames).toEqual(['a', 'b']);
  });

  it('emits no sections at all for an action with no props', () => {
    const sections = configSectionUtils.buildSections({
      propertyGroups: undefined,
      essentialProps: {},
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections).toEqual([]);
  });

  it('orders connection first, then page groups, then advanced', () => {
    const groups: PropertyGroup[] = [
      { key: 'one', display: 'page', label: 'One', props: ['a'] },
      { key: 'two', display: 'page', label: 'Two', props: ['b'] },
    ];

    const sections = configSectionUtils.buildSections({
      propertyGroups: groups,
      essentialProps: { a: shortText('A'), b: shortText('B') },
      advancedPropNames: ['c'],
      hasConnection: true,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections.map((section) => section.key)).toEqual([
      'connection',
      'group-one',
      'group-two',
      'advanced',
    ]);
  });

  it('sweeps props left out of every page group into Other Settings', () => {
    const groups: PropertyGroup[] = [
      { key: 'one', display: 'page', label: 'One', props: ['a'] },
    ];

    const sections = configSectionUtils.buildSections({
      propertyGroups: groups,
      essentialProps: { a: shortText('A'), stray: shortText('Stray') },
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections.map((section) => section.key)).toEqual([
      'group-one',
      'other',
    ]);
    expect(sections[1].propNames).toEqual(['stray']);
  });

  it('ignores group displays that are not page', () => {
    const groups: PropertyGroup[] = [
      { key: 'tabbed', display: 'tabs', label: 'Tabbed', props: ['a'] },
    ];

    const sections = configSectionUtils.buildSections({
      propertyGroups: groups,
      essentialProps: { a: shortText('A') },
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections.map((section) => section.key)).toEqual(['configuration']);
  });

  it('adds an advanced section for error handling even with no advanced props', () => {
    const sections = configSectionUtils.buildSections({
      propertyGroups: undefined,
      essentialProps: { a: shortText('A') },
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: true,
      hasTest: false,
    });

    expect(sections.map((section) => section.key)).toEqual([
      'configuration',
      'advanced',
    ]);
  });

  it('drops group members that are not in the essential props', () => {
    const groups: PropertyGroup[] = [
      { key: 'one', display: 'page', label: 'One', props: ['a', 'missing'] },
    ];

    const sections = configSectionUtils.buildSections({
      propertyGroups: groups,
      essentialProps: { a: shortText('A') },
      advancedPropNames: [],
      hasConnection: false,
      hasErrorHandling: false,
      hasTest: false,
    });

    expect(sections[0].propNames).toEqual(['a']);
  });
});

describe('configSectionUtils.requiredNamesOf', () => {
  it('treats the connection section as always required', () => {
    const required = configSectionUtils.requiredNamesOf({
      section: {
        key: 'connection',
        kind: 'connection',
        label: 'Connection',
        propNames: ['auth'],
      },
      props: {},
    });

    expect(required).toEqual(['auth']);
  });

  it('returns only the required props of a property section', () => {
    const required = configSectionUtils.requiredNamesOf({
      section: {
        key: 'group-one',
        kind: 'properties',
        label: 'One',
        propNames: ['a', 'b'],
      },
      props: { a: shortText('A', true), b: shortText('B') },
    });

    expect(required).toEqual(['a']);
  });
});
