import { t } from 'i18next';
import { Info } from 'lucide-react';
import { FC } from 'react';

import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanName } from '@activepieces/ee-shared';

import {
  DEFAULT_ACTIVE_FLOWS,
  DEFAULT_PROJECTS,
  DEFAULT_SEATS,
  MAX_ACTIVE_FLOWS,
  MAX_PROJECTS,
  MAX_SEATS,
} from './data';

import { CurrentPlanInfo } from '.';

const AddonSlider: FC<{
  title: string;
  description: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  max: number;
  min: number;
  step: number;
  currentLimit: number;
  unit: string;
}> = ({
  title,
  description,
  value,
  onValueChange,
  max,
  min,
  step,
  currentLimit,
  unit,
}) => {
  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/10">
      <div className="flex items-center gap-2">
        <h4 className="text-base font-semibold">{title}</h4>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Total {unit}s</label>
          <div className="text-base font-bold px-3 py-1 bg-primary/10 rounded-md">
            {value[0]}
          </div>
        </div>

        <div className="space-y-4">
          <Slider
            value={value}
            onValueChange={onValueChange}
            max={max}
            min={min}
            step={step}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t(`${min} ${unit}s (min)`)}</span>
            <span>{t(`${max} ${unit}s (max)`)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AddonsStep: FC<{
  selectedPlan: string;
  currentPlanInfo: CurrentPlanInfo;
  selectedSeats: number[];
  onSeatsChange: (value: number[]) => void;
  selectedActiveFlows: number[];
  onActiveFlowsChange: (value: number[]) => void;
  selectedProjects: number[];
  onProjectsChange: (value: number[]) => void;
}> = ({
  selectedPlan,
  currentPlanInfo,
  selectedSeats,
  onSeatsChange,
  selectedActiveFlows,
  onActiveFlowsChange,
  selectedProjects,
  onProjectsChange,
}) => {
  const isBusinessPlan = selectedPlan === PlanName.BUSINESS;
  const isPlus = selectedPlan === PlanName.PLUS;
  const {
    activeFlows: currentActiveFlowLimit,
    seats: currentUserLimit,
    projects: currentProjectLimit,
  } = currentPlanInfo;

  const maxActiveFlows =
    MAX_ACTIVE_FLOWS[selectedPlan as PlanName.PLUS | PlanName.BUSINESS];
  const minActiveFlows =
    DEFAULT_ACTIVE_FLOWS[selectedPlan as PlanName.PLUS | PlanName.BUSINESS];

  return (
    <div className="grid grid-rows-3 h-full gap-4">
      {(isBusinessPlan || isPlus) && (
        <AddonSlider
          title={t('Active Flows')}
          description={t('Increase your automation capacity')}
          value={selectedActiveFlows}
          onValueChange={onActiveFlowsChange}
          max={maxActiveFlows}
          min={minActiveFlows}
          step={5}
          currentLimit={currentActiveFlowLimit}
          unit="flow"
        />
      )}

      {isBusinessPlan && (
        <>
          <AddonSlider
            title={t('User Seats')}
            description={t('Add more team members to your workspace')}
            value={selectedSeats}
            onValueChange={onSeatsChange}
            max={MAX_SEATS}
            min={DEFAULT_SEATS}
            step={1}
            currentLimit={currentUserLimit}
            unit="seat"
          />

          <AddonSlider
            title={t('Projects')}
            description={t('Organize your work with more projects')}
            value={selectedProjects}
            onValueChange={onProjectsChange}
            max={MAX_PROJECTS}
            min={DEFAULT_PROJECTS}
            step={1}
            currentLimit={currentProjectLimit}
            unit="project"
          />
        </>
      )}
    </div>
  );
};
