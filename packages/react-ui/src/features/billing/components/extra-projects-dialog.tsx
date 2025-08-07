import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { PlanName, PRICE_PER_EXTRA_PROJECT } from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

import { billingMutations } from '../lib/billing-hooks';

const MAX_PROJECTS = 30;
const DEFAULT_PROJECTS = 10;

type ExtraProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformSubscription: PlatformBillingInformation;
};

export const ExtraProjectsDialog = ({
  open,
  onOpenChange,
  platformSubscription,
}: ExtraProjectsDialogProps) => {
  const { plan } = platformSubscription;

  const currentProjectLimit = plan.projectsLimit ?? DEFAULT_PROJECTS;
  const [selectedProjects, setSelectedProjects] = useState([
    currentProjectLimit,
  ]);

  const newProjectCount = selectedProjects[0];
  const projectDifference = newProjectCount - currentProjectLimit;
  const costDifference = projectDifference * PRICE_PER_EXTRA_PROJECT;

  const { mutate: updateProjects, isPending } =
    billingMutations.useUpdateSubscription(() => onOpenChange(false));

  useEffect(() => {
    setSelectedProjects([currentProjectLimit]);
  }, [currentProjectLimit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Manage Projects
          </DialogTitle>
          <DialogDescription>
            Adjust your project capacity by modifying the number of projects.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Total number of projects
              </label>
              <p className="text-lg font-bold px-3 py-1">{newProjectCount}</p>
            </div>
            <div className="space-y-3">
              <Slider
                value={selectedProjects}
                onValueChange={setSelectedProjects}
                max={MAX_PROJECTS}
                min={DEFAULT_PROJECTS}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{DEFAULT_PROJECTS} projects (minimum)</span>
                <span>{MAX_PROJECTS} projects (maximum)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Current projects: {currentProjectLimit}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  {costDifference >= 0
                    ? 'Additional Monthly Cost'
                    : 'Monthly Savings'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(projectDifference)} project
                  {Math.abs(projectDifference) !== 1 ? 's' : ''} × $
                  {PRICE_PER_EXTRA_PROJECT}
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  costDifference >= 0 ? 'text-primary' : 'text-green-600'
                }`}
              >
                {costDifference >= 0 ? '+' : '-'}${Math.abs(costDifference)}
              </div>
            </div>
          </div>

          {projectDifference < 0 && (
            <div className="text-xs text-muted-foreground">
              You will be charged a prorated amount for the remaining days of
              the month.
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              updateProjects({
                plan: PlanName.BUSINESS,
                addons: {
                  projects: newProjectCount,
                },
              })
            }
            disabled={isPending || newProjectCount === currentProjectLimit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating Projects
              </>
            ) : (
              'Update Projects'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
