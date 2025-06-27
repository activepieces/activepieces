import { t } from 'i18next';

import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceTag,
  PieceTagType,
  PieceStepMetadata,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  ActionType,
  isNil,
  PlatformWithoutSensitiveData,
  TriggerType,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

const piecesNames = {
  webhook: '@activepieces/piece-webhook',
  schedule: '@activepieces/piece-schedule',
  tables: '@activepieces/piece-tables',
  todos: '@activepieces/piece-todos',
} as const;
const PieceSelectorIntro = ({
  setSelectedPieceGroupType,
  isForTrigger,
}: {
  setSelectedPieceGroupType: (groupType: PieceTagType) => void;
  isForTrigger: boolean;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: pieces, isLoading: isLoadingPieces } =
    piecesHooks.usePiecesSearch({
      searchQuery: '',
      type: isForTrigger ? 'trigger' : 'action',
    });
  const [setSelectedPieceMetadataInPieceSelector] = useBuilderStateContext(
    (state) => [state.setSelectedPieceMetadataInPieceSelector],
  );
  const onGroupClick = (group: PieceTag) => {
    setSelectedPieceGroupType(group.type);
    if (group.type === PieceTagType.ALL) {
      setSelectedPieceMetadataInPieceSelector(group.stepMetadata);
    } else {
      setSelectedPieceMetadataInPieceSelector(null);
    }
  };

  if (isLoadingPieces) {
    return (
      <div className="flex flex-col gap-2">
        <CardListItemSkeleton numberOfCards={2} withCircle={false} />
      </div>
    );
  }
  const groups = createPiecesGroups(pieces, platform, isForTrigger);
  return (
    <CardList className="w-full" listClassName="gap-0">
      {groups.map((group) => (
        <CardListItem
          className="py-2.5"
          key={group.title}
          interactive={true}
          onClick={() => onGroupClick(group)}
        >
          <div className="flex items-center gap-4">
            <PieceIcon showTooltip={false} logoUrl={group.logoUrl} size="md" />
            <div className="flex flex-col gap-1">
              <div className="text-sm">{group.title}</div>
              <div className="text-xs text-muted-foreground">
                {group.description}
              </div>
            </div>
          </div>
        </CardListItem>
      ))}
    </CardList>
  );
};

const isPieceMetadata = (
  stepMetadata: StepMetadataWithSuggestions,
): stepMetadata is PieceStepMetadata => {
  return (
    stepMetadata.type === ActionType.PIECE ||
    stepMetadata.type === TriggerType.PIECE
  );
};

const createPiecesGroups = (
  categorizedStepsMetadata: CategorizedStepMetadataWithSuggestions[],
  platform: PlatformWithoutSensitiveData,
  isForTrigger: boolean,
) => {
  const stepsMetadata = categorizedStepsMetadata.flatMap(
    (categorizedStepsMetadata) => categorizedStepsMetadata.metadata,
  );
  const piecesMetadata = stepsMetadata.filter(isPieceMetadata);
  const tablesPieceMetadata = piecesMetadata.find(
    (stepMetadata) => stepMetadata.pieceName === piecesNames.tables,
  );
  const todosPieceMetadata = piecesMetadata.find(
    (stepMetadata) => stepMetadata.pieceName === piecesNames.todos,
  );
  const webhooksPieceMetadata = piecesMetadata.find(
    (stepMetadata) => stepMetadata.pieceName === piecesNames.webhook,
  );
  const schedulePieceMetadata = piecesMetadata.find(
    (stepMetadata) => stepMetadata.pieceName === piecesNames.schedule,
  );
  const aiAndAgentsGroup = {
    type: PieceTagType.AI_AND_AGENTS,
    title: t('AI and Agents'),
    description: t('Use AI to do tasks on your behalf'),
    logoUrl: 'https://cdn.activepieces.com/pieces/agent.png',
  } as const;
  const groups: PieceTag[] = [
    {
      type: PieceTagType.APPS,
      title: 'Apps',
      description: t('Build your flow using popular apps'),
      logoUrl: 'https://cdn.activepieces.com/pieces/apps.svg',
    },
    {
      type: PieceTagType.CORE,
      title: t('Core'),
      description: t('Core building blocks of your workflows'),
      logoUrl: 'https://cdn.activepieces.com/pieces/core.svg',
    },
  ];
  if (!isNil(aiAndAgentsGroup) && !isForTrigger) {
    groups.push(aiAndAgentsGroup);
  }
  if (!isNil(webhooksPieceMetadata) && isForTrigger) {
    groups.push({
      type: PieceTagType.ALL,
      title: t('Webhooks'),
      description: t('Receive events from external services'),
      logoUrl: webhooksPieceMetadata.logoUrl,
      stepMetadata: webhooksPieceMetadata,
    });
  }

  if (!isNil(schedulePieceMetadata) && isForTrigger) {
    groups.push({
      type: PieceTagType.ALL,
      title: t('Schedule'),
      description: t('Run your flow on a schedule'),
      logoUrl: schedulePieceMetadata.logoUrl,
      stepMetadata: schedulePieceMetadata,
    });
  }
  if (!isNil(tablesPieceMetadata)) {
    groups.push({
      type: PieceTagType.ALL,
      title: t('Tables'),
      description: t('Automate organizing and storing your data'),
      logoUrl: tablesPieceMetadata.logoUrl,
      stepMetadata: tablesPieceMetadata,
    });
  }
  if (!isNil(todosPieceMetadata) && !isForTrigger) {
    groups.push({
      type: PieceTagType.ALL,
      title: t('Human in The Loop'),
      description: t(
        'Ask for human input to review and approve before proceeding',
      ),
      logoUrl: todosPieceMetadata.logoUrl,
      stepMetadata: todosPieceMetadata,
    });
  }

  const pinnedPieces = platform.pinnedPieces ?? [];
  const pinnedPiecesGroups = pinnedPieces
    .map((piece) => {
      const pieceMetadata = stepsMetadata.find(
        (stepMetadata) =>
          isPieceMetadata(stepMetadata) && stepMetadata.pieceName === piece,
      );
      if (isNil(pieceMetadata)) {
        return null;
      }
      return {
        type: PieceTagType.ALL,
        title: pieceMetadata.displayName,
        description: pieceMetadata.description,
        logoUrl: pieceMetadata.logoUrl,
        stepMetadata: pieceMetadata,
      };
    })
    .filter((group) => !isNil(group));

  return [...pinnedPiecesGroups, ...groups];
};

PieceSelectorIntro.displayName = 'PieceSelectorIntro';
export default PieceSelectorIntro;
