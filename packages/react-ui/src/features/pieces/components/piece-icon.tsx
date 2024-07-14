import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { piecesHooks } from "../lib/pieces-hook";
import React from "react";
import { VariantProps, cva } from "class-variance-authority";


const pieceIconVariants = cva(
    "p-2 bg-accent flex items-center justify-center",
    {
        variants: {
            circle: {
                true: "rounded-full",
            },
            size: {
                md: "w-[36px] h-[36px]",
            },
            border: {
                true: "border border-solid border-dividers",
                false: "",
            },

        },
        defaultVariants: {
        },
    }
)

interface PieceIconCircleProps extends VariantProps<typeof pieceIconVariants> {
    pieceName: string
}

const PieceIcon = React.memo(({ pieceName, border, size, circle }: PieceIconCircleProps) => {

    const { data, isSuccess } = piecesHooks.usePiece({ name: pieceName, version: undefined });

    return <>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={pieceIconVariants({ border, size, circle })}>
                    {isSuccess && data ? <img src={data?.logoUrl} className="object-contain" /> : null}
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isSuccess && data ? data?.displayName : null}
            </TooltipContent>
        </Tooltip>

    </>
})

export { PieceIcon }