import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { CardList, CardListItem, CardListItemSkeleton } from '@/components/ui/card-list';
import { Button } from '@/components/ui/button';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { PieceSearchSuggestions } from './piece-search-suggestions';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ActionType, ApFlagId, FlowOperationType, TriggerType, supportUrl } from '@activepieces/shared';
import { StepMetadata, PieceSelectorOperation, HandleSelectCallback, StepMetadataWithSuggestions } from '@/features/pieces/lib/types';
import { PieceTagEnum } from './piece-tag-group';
import { cn } from '../../../lib/utils';
import { t } from 'i18next';
import { Separator } from '@/components/ui/seperator';
import { platformHooks } from '@/hooks/platform-hooks';

type PieceGroup = {
    title: string;
    pieces: StepMetadataWithSuggestions[];
};

type PiecesCardListProps = {
    debouncedQuery: string;
    selectedTag: PieceTagEnum;
    selectedPieceMetadata: StepMetadata | undefined;
    setSelectedMetadata: (metadata: StepMetadata) => void;
    operation: PieceSelectorOperation;
    handleSelect: HandleSelectCallback;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
    debouncedQuery,
    selectedTag,
    selectedPieceMetadata,
    setSelectedMetadata,
    operation,
    handleSelect,
}) => {
    const { data: showRequestPieceButton } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_COMMUNITY);

    const { platform } = platformHooks.useCurrentPlatform();

    const isTrigger = operation.type === FlowOperationType.UPDATE_TRIGGER;
    const { metadata, isLoading: isLoadingPieces } = piecesHooks.useAllStepsMetadata({
        searchQuery: debouncedQuery,
        type: isTrigger ? 'trigger' : 'action',
    });

    const pieceGroups = React.useMemo(() => {
        if (!metadata) return [];

        const filteredMetadataOnTag = metadata.filter((stepMetadata) => {
            switch (selectedTag) {
                case PieceTagEnum.CORE:
                    return pieceSelectorUtils.isCorePiece(stepMetadata);
                case PieceTagEnum.AI:
                    return pieceSelectorUtils.isAiPiece(stepMetadata);
                case PieceTagEnum.APPS:
                    return pieceSelectorUtils.isAppPiece(stepMetadata);
                case PieceTagEnum.ALL:
                default:
                    return true;
            }
        });

        const piecesMetadata = debouncedQuery.length > 0
            ? filterOutPiecesWithNoSuggestions(filteredMetadataOnTag)
            : filteredMetadataOnTag;

        const sortedPiecesMetadata = piecesMetadata.sort((a, b) => a.displayName.localeCompare(b.displayName));
        const flowControllerPieces = sortedPiecesMetadata.filter(pieceSelectorUtils.isFlowController);
        const universalAiPieces = sortedPiecesMetadata.filter(pieceSelectorUtils.isUniversalAiPiece);
        const utilityCorePieces = sortedPiecesMetadata.filter((p) => pieceSelectorUtils.isUtilityCorePiece(p, platform, isTrigger));
        const popularPieces = sortedPiecesMetadata.filter((p) => pieceSelectorUtils.isPopularPieces(p, platform));
        const other = sortedPiecesMetadata.filter((p) =>
            !popularPieces.includes(p) && !utilityCorePieces.includes(p) && !flowControllerPieces.includes(p) && !universalAiPieces.includes(p)
        );

        const groups: PieceGroup[] = [
            { title: 'Popular', pieces: popularPieces },
            { title: 'Flow Controller', pieces: flowControllerPieces },
            { title: 'Utility', pieces: utilityCorePieces },
            { title: 'Universal AI', pieces: universalAiPieces },
            { title: 'Other', pieces: other },
        ];

        return groups.filter(group => group.pieces.length > 0);
    }, [metadata, selectedTag, debouncedQuery]);

    const piecesIsLoaded = !isLoadingPieces && pieceGroups.length > 0;
    const noResultsFound = !isLoadingPieces && pieceGroups.length === 0;

    return (
        <CardList
            className={cn('w-[250px] min-w-[250px] transition-all ', {
                'w-full': debouncedQuery.length > 0,
            })}
            listClassName="gap-0"
        >
            {isLoadingPieces && (
                <div className="flex flex-col gap-2">
                    <CardListItemSkeleton numberOfCards={2} withCircle={false} />
                </div>
            )}

            {piecesIsLoaded && pieceGroups.map((group, index) => (
                <React.Fragment key={group.title}>
                    {index > 0 && <div className='my-1'>
                        <Separator />
                    </div>}
                    {pieceGroups.length > 1 && (
                        <div className='text-sm text-muted-foreground mx-2 mt-2'>{group.title}</div>
                    )}

                    {group.pieces.map((pieceMetadata) => (
                        <PieceCardListItem
                            key={pieceSelectorUtils.toKey(pieceMetadata)}
                            pieceMetadata={pieceMetadata}
                            selectedPieceMetadata={selectedPieceMetadata}
                            debouncedQuery={debouncedQuery}
                            setSelectedMetadata={setSelectedMetadata}
                            handleSelect={handleSelect}
                        />
                    ))}
                </React.Fragment>
            ))}

            {noResultsFound && (
                <div className="flex flex-col gap-2 items-center justify-center h-[300px] ">
                    <SearchX className="w-10 h-10" />
                    <div className="text-sm ">{t('No pieces found')}</div>
                    <div className="text-sm ">{t('Try adjusting your search')}</div>
                    {showRequestPieceButton && (
                        <Link to={`${supportUrl}/c/feature-requests/9`} target="_blank" rel="noopener noreferrer">
                            <Button className="h-8 px-2 ">Request Piece</Button>
                        </Link>
                    )}
                </div>
            )}
        </CardList>
    );
};

const PieceCardListItem: React.FC<{
    pieceMetadata: StepMetadataWithSuggestions;
    selectedPieceMetadata: StepMetadata | undefined;
    debouncedQuery: string;
    setSelectedMetadata: (metadata: StepMetadata) => void;
    handleSelect: HandleSelectCallback;
}> = ({ pieceMetadata, selectedPieceMetadata, debouncedQuery, setSelectedMetadata, handleSelect }) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (element: HTMLDivElement) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (element.matches(':hover')) {
                setSelectedMetadata(pieceMetadata);
            }
        }, 100);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    return (
        <div onMouseLeave={handleMouseLeave}>
            <CardListItem
                className="flex-col p-3 gap-1 items-start"
                selected={
                    pieceMetadata.displayName === selectedPieceMetadata?.displayName &&
                    debouncedQuery.length === 0
                }
                interactive={debouncedQuery.length === 0}
                onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}
            >
                <div className="flex gap-2 items-center">
                    <PieceIcon
                        logoUrl={pieceMetadata.logoUrl}
                        displayName={pieceMetadata.displayName}
                        showTooltip={false}
                        size={'sm'}
                    />
                    <div className="flex-grow h-full flex items-center justify-left text-sm">
                        {pieceMetadata.displayName}
                    </div>
                </div>
            </CardListItem>

            {debouncedQuery.length > 0 && pieceMetadata.type !== TriggerType.EMPTY && (
                <div onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}>
                    <PieceSearchSuggestions
                        pieceMetadata={pieceMetadata}
                        handleSelectOperationSuggestion={handleSelect}
                    />
                </div>
            )}
        </div>
    );
};

function filterOutPiecesWithNoSuggestions(metadata: StepMetadataWithSuggestions[]) {
    return metadata.filter((step) => {
        const isActionWithSuggestions = step.type === ActionType.PIECE && step.suggestedActions && step.suggestedActions.length > 0;
        const isTriggerWithSuggestions = step.type === TriggerType.PIECE && step.suggestedTriggers && step.suggestedTriggers.length > 0;
        const isNotPieceType = step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE;

        return isActionWithSuggestions || isTriggerWithSuggestions || isNotPieceType;
    });
}
