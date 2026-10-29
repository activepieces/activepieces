import {
  DropdownState,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from './api';
import type { DatabricksColumn } from './types';

function warehouseId<R extends boolean>({
  required,
  displayName = 'SQL Warehouse',
  description = 'The SQL warehouse that runs the statement. The service principal needs "Can use" permission on it.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      const warehouses = await databricksApi.listWarehouses({ auth });
      return {
        disabled: false,
        options: warehouses.map((warehouse) => ({
          label: warehouse.state
            ? `${warehouse.name} (${warehouse.state.toLowerCase()})`
            : warehouse.name,
          value: warehouse.id,
        })),
        placeholder:
          warehouses.length === 0 ? 'No SQL warehouses found.' : undefined,
      };
    },
  });
}

function catalogName<R extends boolean>({
  required,
  displayName = 'Catalog',
  description = 'The Unity Catalog catalog.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      const catalogs = await databricksApi.listCatalogs({ auth });
      return {
        disabled: false,
        options: catalogs.map((catalog) => ({
          label: catalog.name,
          value: catalog.name,
        })),
      };
    },
  });
}

function schemaName<R extends boolean>({
  required,
  displayName = 'Schema',
  description = 'The schema inside the selected catalog.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: ['catalogName'],
    options: async ({ auth, catalogName }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      if (!catalogName) {
        return disabledOptions({
          placeholder: 'Please select a catalog first.',
        });
      }
      const schemas = await databricksApi.listSchemas({
        auth,
        catalogName: String(catalogName),
      });
      return {
        disabled: false,
        options: schemas.map((schema) => ({
          label: schema.name,
          value: schema.name,
        })),
      };
    },
  });
}

function tableName<R extends boolean>({
  required,
  displayName = 'Table',
  description = 'The table inside the selected schema.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: ['catalogName', 'schemaName'],
    options: async ({ auth, catalogName, schemaName }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      if (!catalogName || !schemaName) {
        return disabledOptions({
          placeholder: 'Please select a catalog and schema first.',
        });
      }
      const tables = await databricksApi.listTables({
        auth,
        catalogName: String(catalogName),
        schemaName: String(schemaName),
      });
      return {
        disabled: false,
        options: tables.map((table) => ({
          label: table.name,
          value: table.name,
        })),
      };
    },
  });
}

function volumeName<R extends boolean>({
  required,
  displayName = 'Volume',
  description = 'The Unity Catalog volume the file is uploaded to, inside the selected schema.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: ['catalogName', 'schemaName'],
    options: async ({ auth, catalogName, schemaName }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      if (!catalogName || !schemaName) {
        return disabledOptions({
          placeholder: 'Please select a catalog and schema first.',
        });
      }
      const volumes = await databricksApi.listVolumes({
        auth,
        catalogName: String(catalogName),
        schemaName: String(schemaName),
      });
      return {
        disabled: false,
        options: volumes.map((volume) => ({
          label: volume.name,
          value: volume.name,
        })),
        placeholder:
          volumes.length === 0 ? 'No volumes found in this schema.' : undefined,
      };
    },
  });
}

function columnName<R extends boolean>({
  required,
  displayName = 'Column',
  description = 'A column of the selected table.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: ['catalogName', 'schemaName', 'tableName'],
    options: async ({ auth, catalogName, schemaName, tableName }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      if (!catalogName || !schemaName || !tableName) {
        return disabledOptions({ placeholder: 'Please select a table first.' });
      }
      const table = await databricksApi.getTable({
        auth,
        catalogName: String(catalogName),
        schemaName: String(schemaName),
        tableName: String(tableName),
      });
      return {
        disabled: false,
        options: (table.columns ?? []).map((column) => ({
          label: `${column.name} (${
            column.type_text ?? column.type_name ?? 'unknown'
          })`,
          value: column.name,
        })),
      };
    },
  });
}

function rowFields<R extends boolean>({
  required,
  displayName = 'Values',
  description = 'One field per table column. Leave a field empty to skip that column.',
}: PropParams<R>) {
  return Property.DynamicProperties({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: ['catalogName', 'schemaName', 'tableName'],
    props: async ({
      auth,
      catalogName,
      schemaName,
      tableName,
    }): Promise<DynamicPropsValue> => {
      if (!auth || !catalogName || !schemaName || !tableName) {
        return {};
      }
      const table = await databricksApi.getTable({
        auth,
        catalogName: String(catalogName),
        schemaName: String(schemaName),
        tableName: String(tableName),
      });
      return columnInputs({ columns: table.columns ?? [] });
    },
  });
}

function rowList<R extends boolean>({
  required,
  displayName = 'Rows',
  description = 'One item per row. Leave a field empty to insert NULL.',
}: PropParams<R>) {
  return Property.DynamicProperties({
    auth: databricksAuth,
    displayName,
    required,
    refreshers: ['catalogName', 'schemaName', 'tableName'],
    props: async ({
      auth,
      catalogName,
      schemaName,
      tableName,
    }): Promise<DynamicPropsValue> => {
      if (!auth || !catalogName || !schemaName || !tableName) {
        return {};
      }
      const table = await databricksApi.getTable({
        auth,
        catalogName: String(catalogName),
        schemaName: String(schemaName),
        tableName: String(tableName),
      });
      return {
        rows: Property.Array({
          displayName,
          description,
          required: true,
          properties: columnInputs({ columns: table.columns ?? [] }),
        }),
      };
    },
  });
}

function columnInputs({
  columns,
}: {
  columns: DatabricksColumn[];
}): DynamicPropsValue {
  return Object.fromEntries(
    columns.map((column) => [
      column.name,
      Property.ShortText({
        displayName: column.name,
        description: [
          `Type: ${column.type_text ?? column.type_name ?? 'unknown'}.`,
          column.type_name &&
          ['ARRAY', 'MAP', 'STRUCT', 'VARIANT'].includes(column.type_name)
            ? 'Enter JSON.'
            : '',
          column.comment ?? '',
        ]
          .filter((part) => part !== '')
          .join(' '),
        required: false,
      }),
    ])
  );
}

function genieSpaceId<R extends boolean>({
  required,
  displayName = 'Genie Space',
  description = 'The Genie space to ask. The service principal needs "Can run" permission on it.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: databricksAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }
      const spaces = await databricksApi.listGenieSpaces({ auth });
      return {
        disabled: false,
        options: spaces.map((space) => ({
          label: space.title,
          value: space.space_id,
        })),
        placeholder: spaces.length === 0 ? 'No Genie spaces found.' : undefined,
      };
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const databricksProps = {
  warehouseId,
  catalogName,
  schemaName,
  tableName,
  volumeName,
  columnName,
  rowFields,
  rowList,
  genieSpaceId,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
