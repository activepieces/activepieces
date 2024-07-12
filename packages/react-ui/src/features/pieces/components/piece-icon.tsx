import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { piecesHooks } from "../lib/pieces-hook";


export function PieceIcon({ pieceName }: { pieceName: string }) {

    const { data, isSuccess } = piecesHooks.usePiece({ name: pieceName, version: undefined });

    return <>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="p-2 rounded-full border border-solid border-dividers flex items-center justify-center bg-white w-[36px] h-[36px]">
                    {isSuccess && data ? <img src={data?.logoUrl} className="object-contain" /> : null}
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isSuccess && data ? data?.displayName : null}
            </TooltipContent>
        </Tooltip>

    </>
}