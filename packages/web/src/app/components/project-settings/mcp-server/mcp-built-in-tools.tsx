import { PopulatedFlow } from '@activepieces/shared';
import { t } from 'i18next';
import { Table2 } from 'lucide-react';

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';

import { FlowCard } from './flow-card';

const TABLE_TOOLS = [
  'list_tables',
  'get_table',
  'create_table',
  'delete_table',
  'list_fields',
  'create_field',
  'update_field',
  'delete_field',
  'list_records',
  'create_records',
  'get_record',
  'update_record',
  'delete_records',
];

export function McpTools({ flows }: McpToolsProps) {
  return (
    <ItemGroup className="gap-2">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Table2 />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('Tables')}</ItemTitle>
          <ItemDescription className="text-xs">
            {TABLE_TOOLS.join(', ')}
          </ItemDescription>
        </ItemContent>
      </Item>
      {flows.map((flow) => (
        <FlowCard key={flow.id} flow={flow} />
      ))}
    </ItemGroup>
  );
}

type McpToolsProps = {
  flows: PopulatedFlow[];
};
