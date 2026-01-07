import { t } from 'i18next';

import { Card, CardContent } from '@/components/ui/card';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useGradientFromPieces } from '@/features/templates/hooks/use-gradient-from-pieces';
import { Template } from '@activepieces/shared';

type TemplateCardProps = {
  template: Template;
  onTemplateSelect: (template: Template) => void;
};

export const ExploreTemplateCard = ({
  template,
  onTemplateSelect,
}: TemplateCardProps) => {
  const displayTags = template.tags.slice(0, 2);
  const hasFlows = template.flows && template.flows.length > 0;
  const gradient = useGradientFromPieces(
    hasFlows ? template.flows![0]?.trigger : undefined,
  );

  return (
    <Card
      onClick={() => onTemplateSelect(template)}
      variant={'interactive'}
      className="h-[260px] w-[330px] flex flex-col"
    >
      <CardContent className="py-5 px-4 flex flex-col gap-1 flex-1 min-h-0">
        <div className="h-14 flex flex-col justify-start flex-shrink-0">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {template.name}
          </h3>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-3 mt-1 flex-shrink-0">
          {template.summary ? (
            template.summary
          ) : (
            <span className="italic">{t('No summary')}</span>
          )}
        </p>

        <div className="h-8 flex gap-2 flex-wrap overflow-hidden mt-1 flex-shrink-0">
          {displayTags.length > 0 ? (
            displayTags
              .slice(0, 1)
              .map((tag, index) => (
                <TagWithBright
                  key={index}
                  index={index}
                  prefix={t('Save')}
                  title={tag.title}
                  color={tag.color}
                  size="sm"
                />
              ))
          ) : (
            <div />
          )}
        </div>
      </CardContent>

      <div
        className="h-16 flex items-center px-4 rounded-b-lg transition-all duration-300"
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
            circle={false}
            background="white"
            excludeCore={true}
          />
        )}
      </div>
    </Card>
  );
};
