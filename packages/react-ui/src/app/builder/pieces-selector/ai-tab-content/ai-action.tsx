import { useRef } from 'react';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PieceSelectorItem, StepMetadataWithSuggestions } from '@/lib/types';
import { FlowActionType, FlowTriggerType } from '@activepieces/shared';

import { useVideoHover } from './use-video-hover';

type AIActionItemProps = {
  item: PieceSelectorItem;
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  actionIcon?: string;
  actionVideo?: string | null;
  isAgent: boolean;
  onClick: () => void;
};

const getPieceSelectorItemInfo = (item: PieceSelectorItem) => {
  if (
    item.type === FlowActionType.PIECE ||
    item.type === FlowTriggerType.PIECE
  ) {
    return {
      displayName: item.actionOrTrigger.displayName,
      description: item.actionOrTrigger.description,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
  };
};

type VideoSectionProps = {
  actionVideo: string | null | undefined;
  actionIcon: string | undefined;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  videoRef: React.RefObject<HTMLVideoElement>;
  isAgent: boolean;
};

const VideoSection = ({
  actionVideo,
  actionIcon,
  stepMetadataWithSuggestions,
  videoRef,
  isAgent,
}: VideoSectionProps) => {
  const containerClasses = isAgent
    ? 'relative h-[50%]'
    : 'relative w-20 h-full';
  const videoClasses = isAgent
    ? 'w-full h-full object-cover rounded-t-md'
    : 'w-full h-full object-cover rounded-l-md';
  const gradientClasses = isAgent
    ? 'absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent/20 rounded-full flex items-center justify-center'
    : 'absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent/20 rounded-full flex items-center justify-center';
  const iconContainerClasses = isAgent
    ? 'w-full h-full flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent/20 rounded-full'
    : 'w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/10 to-transparent/20 rounded-full';

  if (actionVideo) {
    return (
      <div className={containerClasses}>
        <video
          ref={videoRef}
          src={actionVideo}
          className={videoClasses}
          muted
          loop
          playsInline
          aria-label="Action preview video"
        />
        <div className={gradientClasses} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={iconContainerClasses}>
        <PieceIcon
          logoUrl={actionIcon || stepMetadataWithSuggestions.logoUrl}
          displayName={stepMetadataWithSuggestions.displayName}
          showTooltip={false}
          size={isAgent ? 'xl' : 'lg'}
        />
      </div>
    </div>
  );
};

type ActionContentProps = {
  displayName: string;
  description: string;
  onClick: () => void;
};

const ActionContent = ({
  displayName,
  description,
  onClick,
}: ActionContentProps) => {
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div className="flex-1 p-2 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-xs leading-tight mb-1">
          {displayName}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
      <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleButtonClick}
          className="px-2 py-0.5 bg-transparent text-xs text-black font-medium rounded-md transition-all"
          aria-label={`Add ${displayName} action`}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const AIActionItem = ({
  item,
  stepMetadataWithSuggestions,
  actionIcon,
  actionVideo,
  isAgent,
  onClick,
}: AIActionItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { handleMouseEnter, handleMouseLeave } = useVideoHover(videoRef);
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(item);

  if (isAgent) {
    return (
      <div
        className="relative h-full rounded-md border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer overflow-hidden group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`${pieceSelectorItemInfo.displayName} action`}
      >
        <VideoSection
          actionVideo={actionVideo}
          actionIcon={actionIcon}
          stepMetadataWithSuggestions={stepMetadataWithSuggestions}
          videoRef={videoRef}
          isAgent={true}
        />
        <div className="p-2 flex-1 flex flex-col">
          <h3 className="font-semibold text-xs leading-tight mb-1">
            {pieceSelectorItemInfo.displayName}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-auto">
            {pieceSelectorItemInfo.description}
          </p>
          <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="absolute right-5 bottom-5 px-2 py-0.5 bg-transparent text-xs text-black font-medium rounded-md transition-all"
              aria-label={`Add ${pieceSelectorItemInfo.displayName} action`}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-md border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden group flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${pieceSelectorItemInfo.displayName} action`}
    >
      <VideoSection
        actionVideo={actionVideo}
        actionIcon={actionIcon}
        stepMetadataWithSuggestions={stepMetadataWithSuggestions}
        videoRef={videoRef}
        isAgent={false}
      />
      <ActionContent
        displayName={pieceSelectorItemInfo.displayName}
        description={pieceSelectorItemInfo.description}
        onClick={onClick}
      />
    </div>
  );
};

AIActionItem.displayName = 'AIActionItem';
export default AIActionItem;
