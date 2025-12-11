import { cn } from "@/lib/utils"
import { flowUtilConsts } from "../../utils/consts"
import { Button } from "@/components/ui/button"
import { ChevronDown, Goal } from "lucide-react"
import ImageWithFallback from "@/components/ui/image-with-fallback"
import { TextWithTooltip } from "@/components/custom/text-with-tooltip"
import { t } from "i18next"

const StepNodeName = ({stepName}: {stepName: string})=>{
    return (
      <div
      className="absolute left-full pl-3 text-accent-foreground text-xs opacity-0 transition-all duration-300 group-hover:opacity-100 "
      style={{
        top: `${flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
      }}
    >
      {stepName}
    </div>
    )
  }
  

  
  const StepNodeChevron = ()=>{
    return (
    <Button
    variant="ghost"
    size="sm"
    className="p-1 size-7 "
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.target) {
        const rightClickEvent = new MouseEvent(
          'contextmenu',
          {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2,
            clientX: e.clientX,
            clientY: e.clientY,
          },
        );
        e.target.dispatchEvent(rightClickEvent);
      }
    }}
  >
    <ChevronDown className="w-4 h-4 stroke-muted-foreground" />
  </Button>
    )
  }
  
  const StepNodeLogo = ({isSkipped, logoUrl, displayName}: {isSkipped: boolean, logoUrl:string, displayName:string})=>{
    return (
      <div
                    className={cn('flex items-center justify-center p-1.5 border-border border border-solid rounded-xl', {
                      'opacity-80': isSkipped,
                    })}
                  >
                    <ImageWithFallback  
                      src={logoUrl}
                      alt={displayName}
                      key={logoUrl + displayName}
                      className="w-[22px] h-[22px]"
                    />
                  </div>
    )
  }
  
  const StepNodeDisplayName = ({stepDisplayName, stepIndex, isSkipped, pieceDisplayName}: {stepDisplayName: string, stepIndex: number, isSkipped: boolean, pieceDisplayName: string})=>{
    return ( <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
      <div className=" flex items-center justify-between min-w-0 w-full">
       <TextWithTooltip tooltipMessage={stepDisplayName.length > 19 ? stepDisplayName : ''}>
       <div
          className={cn('text-xs truncate font-semibold grow shrink ', {
            'text-accent-foreground/70': isSkipped,
          })}
        >
          {stepIndex}. {stepDisplayName}
        </div>
       </TextWithTooltip>
  
   
      </div>
  
      <div className="flex justify-between w-full items-center">
        <div className="text-xs truncate text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
          {pieceDisplayName}
        </div>
      </div>
    </div>)
  }

  const Triggerwidget = ()=>{
    return (
      <div className="flex items-center absolute -top-[27px] -left-[1px] border-border border border-b-transparent  justify-center gap-1 rounded-t-lg bg-secondary text-muted-foreground text-xs p-1 ">
        <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
      </div>
    )
  }
  export { StepNodeName, StepNodeChevron, StepNodeLogo, StepNodeDisplayName, Triggerwidget }