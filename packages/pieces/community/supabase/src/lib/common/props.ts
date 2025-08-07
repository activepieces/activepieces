import { Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { createClient } from "@supabase/supabase-js";

async function getColumnOptions(auth: any, table_name: string) {
  try {
    const { url, apiKey } = auth as { url: string; apiKey: string };
    const supabase = createClient(url, apiKey);
    
    try {
      const { data: columns, error } = await supabase.rpc('get_table_columns', { 
        p_table_name: table_name 
      });
      
      if (!error && columns && columns.length > 0) {
        return columns.map((col: any) => ({
          label: `${col.column_name} (${col.data_type})`,
          value: col.column_name
        }));
      }
    } catch (rpcError) {
      // Continue to OpenAPI fallback
    }
    
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/openapi+json'
      }
    });

    if (response.ok) {
      const openApiSpec = await response.json();
      const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
      const tableDefinition = definitions[table_name];
      
      if (tableDefinition && tableDefinition.properties) {
        return Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
          const type = columnDef.type || 'unknown';
          return {
            label: `${columnName} (${type})`,
            value: columnName
          };
        });
      }
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

export const supabaseCommon = {
  table_name: Property.Dropdown({
    displayName: 'Table Name',
    description: 'Select a table from your database',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Supabase account first.'
        };
      }

      try {
        const { url, apiKey } = auth as { url: string; apiKey: string };
        const supabase = createClient(url, apiKey);
        
        try {
          const { data: tables, error } = await supabase.rpc('get_public_tables');
          if (!error && tables) {
            const tableOptions = tables.map((table: any) => ({
              label: table.table_name || table.name || table,
              value: table.table_name || table.name || table
            }));
            return {
              disabled: false,
              options: tableOptions
            };
          } else if (error) {
            console.log('RPC get_public_tables error:', error);
          }
        } catch (rpcError) {
          console.log('RPC function not available, using OpenAPI spec');
        }
        
        let openApiSpec: any;
        try {
          const response = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/openapi+json'
            }
          });

          if (!response.ok) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Error loading tables. Please check your connection and permissions.'
            };
          }
          openApiSpec = await response.json();
        } catch (fetchError) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Network error. Please check your connection.'
          };
        }
        const paths = openApiSpec.paths || {};
        
        const tableNames = Object.keys(paths)
          .filter(path => path.startsWith('/') && !path.includes('{') && path !== '/rpc')
          .map(path => path.substring(1))
          .filter(name => name && !name.includes('/'))
          .sort();

        if (tableNames.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No tables found in your database.'
          };
        }

        const tableOptions = tableNames.map(name => ({
          label: name,
          value: name
        }));

        return {
          disabled: false,
          options: tableOptions
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading tables. Please check your connection.'
        };
      }
    }
  }),

  table_columns: Property.DynamicProperties({
    displayName: 'Row Data',
    description: 'Enter the data for each column',
    required: true,
    refreshers: ['table_name'],
    props: async (propsValue) => {
      const { auth, table_name } = propsValue;
      const properties: DynamicPropsValue = {};

      if (!auth || !table_name) {
        return properties;
      }

      try {
        const { url, apiKey } = auth as { url: string; apiKey: string };
        const supabase = createClient(url, apiKey);
        
        let columns: any[] = [];
        
        try {
          const { data: rpcColumns, error } = await supabase.rpc('get_table_columns', { 
            p_table_name: table_name as unknown as string 
          });
          
          if (!error && rpcColumns && rpcColumns.length > 0) {
            columns = rpcColumns;
          } else if (error) {
            console.log('RPC get_table_columns error:', error);
          }
        } catch (rpcError) {
          console.log('RPC function not available for columns');
        }
        
        if (columns.length === 0) {
          let openApiSpec: any;
          try {
            const response = await fetch(`${url}/rest/v1/`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/openapi+json'
              }
            });

            if (!response.ok) {
              properties['error'] = Property.MarkDown({
                value: `Error loading columns for table "${table_name}". Please check your connection and permissions.`
              });
              return properties;
            }
            openApiSpec = await response.json();
          } catch (fetchError) {
            properties['error'] = Property.MarkDown({
              value: `Network error loading columns for table "${table_name}". Please check your connection.`
            });
            return properties;
          }
          const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
          
          const tableDefinition = definitions[table_name as unknown as string];
          if (!tableDefinition || !tableDefinition.properties) {
            properties['info'] = Property.MarkDown({
              value: `No columns found for table "${table_name}". Please check if the table exists.`
            });
            return properties;
          }

          columns = Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
            let dataType = 'text';
            
            if (columnDef.type) {
              dataType = columnDef.type;
              
              if (columnDef.type === 'array') {
                dataType = 'array';
              }
              else if (columnDef.format) {
                if (columnDef.format === 'date-time' || columnDef.format === 'timestamp') {
                  dataType = 'timestamp';
                } else if (columnDef.format === 'date') {
                  dataType = 'date';
                } else if (columnDef.format === 'uuid') {
                  dataType = 'uuid';
                } else if (columnDef.format === 'bigint') {
                  dataType = 'bigint';
                }
              }
            }
            
            return {
              column_name: columnName,
              data_type: dataType,
              is_nullable: !tableDefinition.required?.includes(columnName) ? 'YES' : 'NO',
              column_default: columnDef.default || null
            };
          });
        }

        for (const column of columns) {
          if (!column.data_type) {
            continue;
          }
          
          const isRequired = column.is_nullable === 'NO' && column.column_default === null;
          const description = `Type: ${column.data_type}${isRequired ? ' (required)' : ''}`;

          switch (column.data_type.toLowerCase()) {
            case 'integer':
            case 'bigint':
            case 'smallint':
            case 'numeric':
            case 'decimal':
            case 'real':
            case 'double precision':
              properties[column.column_name] = Property.Number({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'boolean':
              properties[column.column_name] = Property.Checkbox({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'date':
            case 'timestamp':
            case 'timestamp with time zone':
            case 'timestamp without time zone':
              // Handle auto-timestamps (created_at, updated_at) differently
              if (column.column_name.includes('created_at') || column.column_name.includes('updated_at')) {
                properties[column.column_name] = Property.ShortText({
                  displayName: `${column.column_name} (auto-generated)`,
                  description: `${description} - Leave empty for auto-generation`,
                  required: false
                });
              } else {
                properties[column.column_name] = Property.DateTime({
                  displayName: column.column_name,
                  description,
                  required: false
                });
              }
              break;
            
            case 'json':
            case 'jsonb':
            case 'object':
              properties[column.column_name] = Property.Json({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'array':
            case '_text':
            case 'text[]':
              properties[column.column_name] = Property.Array({
                displayName: column.column_name,
                description: `${description} - Enter each item separately`,
                required: false
              });
              break;
            
            case 'uuid':
              // UUID fields - offer auto-generation option
              if (column.column_name === 'id' || column.column_name.endsWith('_id')) {
                properties[column.column_name] = Property.ShortText({
                  displayName: `${column.column_name} (auto-generated)`,
                  description: `${description} - Leave empty for auto-generation`,
                  required: false
                });
              } else {
                properties[column.column_name] = Property.ShortText({
                  displayName: column.column_name,
                  description,
                  required: false
                });
              }
              break;
            
            case 'string':
            case 'text':
            case 'varchar':
            case 'character varying':
            case 'char':
            case 'character':
            default:
              if (column.column_name.toLowerCase().includes('email')) {
                properties[column.column_name] = Property.ShortText({
                  displayName: column.column_name,
                  description: `${description} - Enter email address`,
                  required: false
                });
              } else if (column.column_name.toLowerCase().includes('id')) {
                properties[column.column_name] = Property.ShortText({
                  displayName: `${column.column_name} (auto-generated)`,
                  description: `${description} - Leave empty for auto-generation`,
                  required: false
                });
              } else {
                properties[column.column_name] = Property.LongText({
                  displayName: column.column_name,
                  description,
                  required: false
                });
              }
              break;
          }
        }

        return properties;
      } catch (error) {
        properties['error'] = Property.MarkDown({
          value: `Error loading columns for table "${table_name}". Please check your connection and permissions.`
        });
        return properties;
      }
    }
  }),

  update_fields: Property.DynamicProperties({
    displayName: 'Update Data',
    description: 'Select which columns to update (auto-generated fields excluded)',
    required: true,
    refreshers: ['table_name'],
    props: async (propsValue) => {
      const { auth, table_name } = propsValue;
      const properties: DynamicPropsValue = {};

      if (!auth || !table_name) {
        return properties;
      }

      try {
        const { url, apiKey } = auth as { url: string; apiKey: string };
        const supabase = createClient(url, apiKey);
        
        let columns: any[] = [];
        
        try {
          const { data: rpcColumns, error } = await supabase.rpc('get_table_columns', { 
            p_table_name: table_name as unknown as string 
          });
          
          if (!error && rpcColumns && rpcColumns.length > 0) {
            columns = rpcColumns;
          }
        } catch (rpcError) {
          // RPC function doesn't exist, continue to OpenAPI fallback
        }
        
        if (columns.length === 0) {
          let openApiSpec: any;
          try {
            const response = await fetch(`${url}/rest/v1/`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/openapi+json'
              }
            });

            if (!response.ok) {
              properties['error'] = Property.MarkDown({
                value: `Error loading columns for table "${table_name}". Please check your connection and permissions.`
              });
              return properties;
            }
            openApiSpec = await response.json();
          } catch (fetchError) {
            properties['error'] = Property.MarkDown({
              value: `Network error loading columns for table "${table_name}". Please check your connection.`
            });
            return properties;
          }
          const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
          
          const tableDefinition = definitions[table_name as unknown as string];
          if (!tableDefinition || !tableDefinition.properties) {
            properties['info'] = Property.MarkDown({
              value: `No columns found for table "${table_name}". Please check if the table exists.`
            });
            return properties;
          }

          columns = Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
            let dataType = 'text';
            if (columnDef.type) {
              dataType = columnDef.type;
              if (columnDef.type === 'array') {
                dataType = 'array';
              } else if (columnDef.format) {
                if (columnDef.format === 'date-time' || columnDef.format === 'timestamp') {
                  dataType = 'timestamp';
                } else if (columnDef.format === 'date') {
                  dataType = 'date';
                } else if (columnDef.format === 'uuid') {
                  dataType = 'uuid';
                } else if (columnDef.format === 'bigint') {
                  dataType = 'bigint';
                }
              }
            }
            
            return {
              column_name: columnName,
              data_type: dataType,
              is_nullable: !tableDefinition.required?.includes(columnName) ? 'YES' : 'NO',
              column_default: columnDef.default || null
            };
          });
        }

        for (const column of columns) {
          if (!column.data_type) continue;
          
          if (
            column.column_name === 'id' ||
            column.column_name.includes('created_at') ||
            column.column_name.includes('updated_at') ||
            (column.data_type === 'uuid' && column.column_name.endsWith('_id'))
          ) {
            continue;
          }
          
          const description = `Type: ${column.data_type} - Update this field`;

          switch (column.data_type.toLowerCase()) {
            case 'integer':
            case 'bigint':
            case 'smallint':
            case 'numeric':
            case 'decimal':
            case 'real':
            case 'double precision':
              properties[column.column_name] = Property.Number({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'boolean':
              properties[column.column_name] = Property.Checkbox({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'date':
            case 'timestamp':
            case 'timestamp with time zone':
            case 'timestamp without time zone':
              properties[column.column_name] = Property.DateTime({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'json':
            case 'jsonb':
            case 'object':
              properties[column.column_name] = Property.Json({
                displayName: column.column_name,
                description,
                required: false
              });
              break;
            
            case 'array':
            case '_text':
            case 'text[]':
              properties[column.column_name] = Property.Array({
                displayName: column.column_name,
                description: `${description} - Enter each item separately`,
                required: false
              });
              break;
            
            default:
              if (column.column_name.toLowerCase().includes('email')) {
                properties[column.column_name] = Property.ShortText({
                  displayName: column.column_name,
                  description: `${description} - Enter email address`,
                  required: false
                });
              } else {
                properties[column.column_name] = Property.LongText({
                  displayName: column.column_name,
                  description,
                  required: false
                });
              }
              break;
          }
        }

        return properties;
      } catch (error) {
        properties['error'] = Property.MarkDown({
          value: `Error loading columns for table "${table_name}". Please check your connection and permissions.`
        });
        return properties;
      }
    }
  }),

  upsert_fields: Property.DynamicProperties({
    displayName: 'Row Data',
    description: 'Enter data for the row (conflict detection handled separately)',
    required: true,
    refreshers: ['table_name', 'on_conflict'],
    props: async (propsValue) => {
      const { auth, table_name, on_conflict } = propsValue;
      const properties: DynamicPropsValue = {};

      if (!auth || !table_name) {
        return properties;
      }

      try {
        const { url, apiKey } = auth as { url: string; apiKey: string };
        const supabase = createClient(url, apiKey);
        
        let columns: any[] = [];
        
        try {
          const { data: rpcColumns, error } = await supabase.rpc('get_table_columns', { 
            p_table_name: table_name as unknown as string 
          });
          if (!error && rpcColumns && rpcColumns.length > 0) {
            columns = rpcColumns;
          }
        } catch (rpcError) {
          console.log('RPC function not available for upsert columns');
        }
        
        if (columns.length === 0) {
          const response = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/openapi+json'
            }
          });

          if (response.ok) {
            const openApiSpec = await response.json();
            const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
            const tableDefinition = definitions[table_name as unknown as string];
            
            if (tableDefinition && tableDefinition.properties) {
              columns = Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => ({
                column_name: columnName,
                data_type: columnDef.type || 'text',
                is_nullable: !tableDefinition.required?.includes(columnName) ? 'YES' : 'NO',
                column_default: columnDef.default || null
              }));
            }
          }
        }

        for (const column of columns) {
          if (!column.data_type || column.column_name === on_conflict) continue;
          
          const description = `Type: ${column.data_type}`;
          properties[column.column_name] = Property.LongText({
            displayName: column.column_name,
            description,
            required: false
          });
        }
      } catch (error) {
        properties['error'] = Property.MarkDown({
          value: `Error loading columns for table "${table_name}".`
        });
      }

      if (on_conflict) {
        properties['_info'] = Property.MarkDown({
          value: `💡 **Note**: The "${on_conflict}" field is used for conflict detection and should not be included in the row data unless you want to update it.`
        });
      }

      return properties;
    }
  })
};