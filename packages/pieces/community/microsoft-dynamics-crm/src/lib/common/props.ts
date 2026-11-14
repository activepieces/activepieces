import { DropdownState, Property } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { makeClient } from './client';
import { LOOKUP_ATTRIBUTE_TYPES } from './constants';
import { dynamicsCommonInternals } from './index';
import { DynamicsAuthValue } from './types';

const RELATIONSHIP_SEPARATOR = '|';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function recordDropdown({ displayName, description, required, entitySetProp }: RecordDropdownParams) {
  return Property.Dropdown({
    auth: dynamicsCRMAuth,
    displayName,
    description,
    required,
    refreshers: [entitySetProp],
    refreshOnSearch: true,
    options: async (propsValue, { searchValue }) => {
      const entitySet = readString(propsValue[entitySetProp]);
      if (!propsValue.auth || !entitySet) {
        return { disabled: true, options: [], placeholder: 'Please select the entity type first.' };
      }
      return dynamicsCommonInternals.recordOptions({ client: makeClient(propsValue.auth), entitySet, searchValue });
    },
  });
}

function fixedRecordDropdown<R extends boolean>({ entitySet, displayName, description, required }: FixedRecordDropdownParams<R>) {
  return Property.Dropdown<string, R, typeof dynamicsCRMAuth>({
    auth: dynamicsCRMAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
      }
      return dynamicsCommonInternals.recordOptions({ client: makeClient(auth), entitySet, searchValue });
    },
  });
}

function entitySetDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown({
    auth: dynamicsCRMAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
      }
      return dynamicsCommonInternals.entitySetOptions(auth);
    },
  });
}

async function columnOptions({ auth, entitySet }: { auth: DynamicsAuthValue; entitySet: string }): Promise<DropdownState<string>> {
  try {
    const client = makeClient(auth);
    const entity = await client.getEntityBySetName(entitySet);
    const attributes = await client.listAttributes(entity.LogicalName);
    const options = attributes
      .filter((attribute) => !attribute.AttributeOf && attribute.IsValidForRead !== false && attribute.AttributeType !== 'Virtual')
      .map((attribute) => {
        const isLookup = LOOKUP_ATTRIBUTE_TYPES.includes(attribute.AttributeType);
        const value = isLookup ? `_${attribute.LogicalName}_value` : attribute.LogicalName;
        const label = attribute.DisplayName?.UserLocalizedLabel?.Label;
        return { label: label ? `${label} (${value})` : value, value };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    return { disabled: false, options };
  } catch (error) {
    return dynamicsCommonInternals.failedDropdown(error);
  }
}

function columnsDropdown({ entitySetProp }: { entitySetProp: string }) {
  return Property.MultiSelectDropdown({
    auth: dynamicsCRMAuth,
    displayName: 'Columns',
    description: 'Columns to return. Leave empty to return every column.',
    required: false,
    refreshers: [entitySetProp],
    options: async (propsValue) => {
      const entitySet = readString(propsValue[entitySetProp]);
      if (!propsValue.auth || !entitySet) {
        return { disabled: true, options: [], placeholder: 'Please select the entity type first.' };
      }
      return columnOptions({ auth: propsValue.auth, entitySet });
    },
  });
}

async function relationshipOptions({ auth, entitySet }: { auth: DynamicsAuthValue; entitySet: string }): Promise<DropdownState<string>> {
  try {
    const client = makeClient(auth);
    const entity = await client.getEntityBySetName(entitySet);
    const relationships = await client.listCollectionRelationships(entity.LogicalName);
    const entities = await client.listEntities();
    const setByLogical = new Map(entities.map((item) => [item.LogicalName, item.EntitySetName]));
    const options = relationships
      .map((rel) => {
        const targetSet = setByLogical.get(rel.targetEntity);
        if (!targetSet) {
          return undefined;
        }
        return {
          label: `${rel.navigationProperty} (${rel.targetEntity}, ${rel.kind === 'many_to_many' ? 'many-to-many' : 'one-to-many'})`,
          value: `${rel.navigationProperty}${RELATIONSHIP_SEPARATOR}${targetSet}`,
        };
      })
      .filter((option): option is { label: string; value: string } => option !== undefined);
    return { disabled: false, options };
  } catch (error) {
    return dynamicsCommonInternals.failedDropdown(error);
  }
}

function parseRelationship(value: unknown): { navigationProperty: string; targetEntitySet: string } {
  const text = readString(value) ?? '';
  const [navigationProperty, targetEntitySet] = text.split(RELATIONSHIP_SEPARATOR);
  if (!navigationProperty || !targetEntitySet) {
    throw new Error('Relationship must be picked from the list (it carries the navigation property and the related table).');
  }
  return { navigationProperty, targetEntitySet };
}

const relationshipDropdown = Property.Dropdown({
  auth: dynamicsCRMAuth,
  displayName: 'Relationship',
  description: 'The one-to-many or many-to-many relationship to link through.',
  required: true,
  refreshers: ['entityType'],
  options: async ({ auth, entityType }) => {
    const entitySet = readString(entityType);
    if (!auth || !entitySet) {
      return { disabled: true, options: [], placeholder: 'Please select the entity type first.' };
    }
    return relationshipOptions({ auth, entitySet });
  },
});

const relatedRecordDropdown = Property.Dropdown({
  auth: dynamicsCRMAuth,
  displayName: 'Related Record',
  description: 'The record on the other side of the relationship. Type to search by name, or map a record ID.',
  required: true,
  refreshers: ['relationship'],
  refreshOnSearch: true,
  options: async ({ auth, relationship }, { searchValue }) => {
    if (!auth || !readString(relationship)) {
      return { disabled: true, options: [], placeholder: 'Please select the relationship first.' };
    }
    try {
      const { targetEntitySet } = parseRelationship(relationship);
      return dynamicsCommonInternals.recordOptions({ client: makeClient(auth), entitySet: targetEntitySet, searchValue });
    } catch (error) {
      return dynamicsCommonInternals.failedDropdown(error);
    }
  },
});

type RecordDropdownParams = {
  displayName: string;
  description: string;
  required: boolean;
  entitySetProp: string;
};

type FixedRecordDropdownParams<R extends boolean> = {
  entitySet: string;
  displayName: string;
  description: string;
  required: R;
};

export const dynamicsProps = {
  recordDropdown,
  fixedRecordDropdown,
  entitySetDropdown,
  columnsDropdown,
  relationshipDropdown,
  relatedRecordDropdown,
  parseRelationship,
  readString,
};
