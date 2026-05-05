import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Fragment } from 'react';

import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { ProposalStep, stepVisuals } from '../lib/step-visuals';

type ProposalFlowDiagramProps = {
  steps: ProposalStep[];
};

export function ProposalFlowDiagram({ steps }: ProposalFlowDiagramProps) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-stretch">
      {steps.map((step, index) => (
        <Fragment key={step.label || index}>
          {index > 0 && <FlowConnector index={index} reduce={!!reduce} />}
          <FlowNode step={step} index={index} reduce={!!reduce} />
        </Fragment>
      ))}
    </div>
  );
}

function FlowNode({
  step,
  index,
  reduce,
}: {
  step: ProposalStep;
  index: number;
  reduce: boolean;
}) {
  const Icon = stepVisuals.iconFor({ kind: step.kind });
  const tone = stepVisuals.toneFor({ kind: step.kind });

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.18,
        delay: reduce ? 0 : index * 0.06,
        ease: 'easeOut',
      }}
      className="flex items-center gap-2.5 rounded-md border bg-background px-2.5 py-1.5 shadow-sm"
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          step.piece ? '' : tone,
        )}
      >
        {step.piece ? (
          <PieceIconWithPieceName
            pieceName={step.piece}
            size="xs"
            border={false}
            showTooltip={false}
          />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
        {step.label}
      </span>
    </motion.div>
  );
}

function FlowConnector({ index, reduce }: { index: number; reduce: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduce ? 0 : 0.16,
        delay: reduce ? 0 : index * 0.06 - 0.02,
      }}
      className="relative flex h-4 items-center justify-center"
    >
      <span className="h-full w-px bg-border" />
      <ChevronDown className="absolute h-3 w-3 text-muted-foreground/60" />
    </motion.div>
  );
}
