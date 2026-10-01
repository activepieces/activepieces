import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { TagWithBright } from '@/components/custom/tag-with-bright';
import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces';
import { useGradientFromPieces } from '@/features/templates';

type TemplateCardProps = {
  template: Template;
  onTemplateSelect: (template: Template) => void;
};

export const ExploreTemplateCard = React.memo(
  ({ template, onTemplateSelect }: TemplateCardProps) => {
    const displayTags = template.tags.slice(0, 2);
    const hasFlows = template.flows && template.flows.length > 0;
    const { gradient } = useGradientFromPieces(
      hasFlows ? template.flows![0]?.trigger : undefined,
    );

    return (
      <Card
        onClick={() => onTemplateSelect(template)}
        variant="interactive"
        className="h-56 w-full gap-0 pb-0"
      >
        <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 h-10 shrink-0 text-sm font-medium">
            {template.name}
          </h3>

          <p className="line-clamp-3 shrink-0 text-xs text-gray-11">
            {template.summary ? (
              template.summary
            ) : (
              <span className="italic">{t('No summary')}</span>
            )}
          </p>

          <div className="flex shrink-0 flex-wrap gap-2 overflow-hidden">
            {displayTags.slice(0, 1).map((tag, index) => (
              <TagWithBright
                key={index}
                index={index}
                prefix={t('Save')}
                title={tag.title}
                color={tag.color}
                size="sm"
              />
            ))}
          </div>
        </CardContent>

        <div
          className="flex h-14 shrink-0 items-center px-4 transition-all duration-300"
          style={{
            background: gradient || 'transparent',
          }}
        >
          {hasFlows && template.flows![0]?.trigger && (
            <PieceIconList
              trigger={template.flows![0]?.trigger}
              maxNumberOfIconsToShow={4}
              size="md"
              className="flex gap-0.5"
              excludeCore={true}
            />
          )}
        </div>
      </Card>
    );
  },
);

ExploreTemplateCard.displayName = 'ExploreTemplateCard';
