import { projectHooks } from "@/hooks/project-hooks";
import React, { useEffect, useState } from "react";
import { FlagGuard } from "./flag-guard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { ProgressCircularComponent } from "@/components/custom/circular-progress";
import { ApFlagId, isNil } from "../../../../shared/src";
import { formatUtils } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { t } from "i18next";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

 const UsageLimitsButton = React.memo(() => {
    const { project,refetch } = projectHooks.useCurrentProject();
   
    if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
      return null;
    }
    useEffect(()=>{
        return ()=>{
            refetch();
        }
    },[refetch]);
    return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>

              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <ProgressCircularComponent
                  size="small"
                  data={{
                    plan: project.plan.tasks,
                    usage: project.usage.tasks,
                  }}
                />
                {t('View Usage')}
              </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="py-3" >
            <div className="flex flex-col gap-7 w-[300px]" >
              <div className="flex items-center gap-3">
                <strong className="min-w-[63px]">{t('Tasks')}</strong>
                <UsageProgress value={project.usage.tasks} max={project.plan.tasks} />
              </div>
              <div className="flex items-center gap-3">
                <strong className="whitespace-nowrap min-w-[63px]">{t('AI Credits')}</strong>
                <UsageProgress value={project.usage.aiTokens} max={project.plan.aiTokens} />
              </div>
            </div>
            <FlagGuard  flag={ApFlagId.SHOW_BILLING}>
                <Separator className="my-4" />
                <div className="flex justify-end ">
                    <Link to={'/plans'}>
                        <Button variant={'outline'} size="sm" className="w-full text-primary hover:!text-primary/80 h-8">
                            {t('Your Plan')}
                        </Button>
                    </Link>
                </div>
            </FlagGuard>
          </TooltipContent>

        </Tooltip>     
    );
  });
  const UsageProgress = ({value, max}: {value: number, max: number}) => {
    return (<div className="flex justify-center flex-col gap-0.5  w-full">
        <div className="text-sm text-muted-foreground flex justify-between">
           <span>{t('Used')}: {formatUtils.formatNumber(value)} </span>
           <span>{t('Limit')}: {formatUtils.formatNumber(max)} </span>
        </div>
        <Progress value={value / max * 100}  className="h-[5px]"/>
    </div>) 
  }
  UsageLimitsButton.displayName = 'UsageLimitsButton';
  export default UsageLimitsButton;