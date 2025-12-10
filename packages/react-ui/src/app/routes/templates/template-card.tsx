import { Card, CardContent } from '@/components/ui/card';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { Template } from '@activepieces/shared';
import { useGradientFromPieces } from '@/lib/utils';
import { t } from 'i18next';

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
    hasFlows ? template.flows![0].trigger : undefined,
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow h-full w-[320px] flex flex-col"
      onClick={() => onTemplateSelect(template)}
    >
      <CardContent className="pt-5 pb-2 px-4 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-lg leading-tight h-14 line-clamp-2">
          {template.name}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-3 h-[3.5rem]">
          {template.summary}
        </p>

        <div className="h-8 flex gap-2 flex-wrap overflow-hidden">
          {displayTags.length > 0 ? (
            displayTags.slice(0, 1).map((tag, index) => (
              <TagWithBright
                key={index}
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
        {hasFlows && (
          <PieceIconList
            trigger={template.flows![0].trigger}
            maxNumberOfIconsToShow={4}
            size="lg"
            className="flex gap-2"
            circle={false}
            background="white"
            shadow={true}
          />
        )}
      </div>
    </Card>
  );
};
