import { FlowStatus, McpTrigger, PopulatedFlow } from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCircle, CircleDot } from 'lucide-react';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/custom/item';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';

export function FlowCard({ flow }: { flow: PopulatedFlow }) {
  const isEnabled = flow.status === FlowStatus.ENABLED;
  const mcpTrigger = flow.version.trigger.settings as McpTrigger;
  const description = mcpTrigger.input?.toolDescription;

  return (
    <Item variant="outline" asChild>
      <a
        href={`/project/${flow.projectId}/flow/${flow.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <PieceIconList
          trigger={flow.version.trigger}
          maxNumberOfIconsToShow={1}
          size="lg"
        />
        <ItemContent>
          <ItemTitle>{flow.version.displayName}</ItemTitle>
          {description && (
            <ItemDescription className="text-xs">
              {description}
            </ItemDescription>
          )}
        </ItemContent>
        <ItemActions>
          <StatusIconWithText
            icon={isEnabled ? CheckCircle : CircleDot}
            text={isEnabled ? t('On') : t('Off')}
            variant={isEnabled ? 'success' : 'default'}
          />
        </ItemActions>
      </a>
    </Item>
  );
}
