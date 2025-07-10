interface NotionDatabaseProperty {
  id: string;
  name: string;
  type: string;
  description?: string;
  select?: {
    options: Array<{ name: string; color: string; id: string }>;
  };
  multi_select?: {
    options: Array<{ name: string; color: string; id: string }>;
  };
  status?: {
    options: Array<{ name: string; color: string; id: string }>;
    groups: Array<{
      name: string;
      color: string;
      id: string;
      option_ids: string[];
    }>;
  };
  relation?: {
    database_id: string;
    synced_property_id?: string;
    synced_property_name?: string;
  };
  formula?: {
    expression: string;
  };
  rollup?: {
    function: string;
    relation_property_id: string;
    relation_property_name: string;
    rollup_property_id: string;
    rollup_property_name: string;
  };
  number?: {
    format: string;
  };
}

interface NotionDatabase {
  id: string;
  title: Array<{ plain_text: string }>;
  description: Array<{ plain_text: string }> | null;
  properties: Record<string, NotionDatabaseProperty>;
}

interface FormStructure {
  id: string;
  title: string;
  description: string;
  properties: Record<
    string,
    {
      name: string;
      type: string;
      id: string;
      description: string;
    }
  >;
  propertyTypes: Record<string, string>;
  requiredFields: string[];
  selectOptions: Record<
    string,
    Array<{ name: string; color: string; id: string }>
  >;
  statusOptions: Record<
    string,
    {
      options: Array<{ name: string; color: string; id: string }>;
      groups: Array<{
        name: string;
        color: string;
        id: string;
        option_ids: string[];
      }>;
    }
  >;
  relationConfig: Record<
    string,
    {
      database_id: string;
      synced_property_id?: string;
      synced_property_name?: string;
    }
  >;
  formulaConfig: Record<string, { expression: string }>;
  rollupConfig: Record<
    string,
    {
      function: string;
      relation_property_id: string;
      relation_property_name: string;
      rollup_property_id: string;
      rollup_property_name: string;
    }
  >;
  numberConfig: Record<string, { format: string }>;
}

export { FormStructure, NotionDatabase, NotionDatabaseProperty };
