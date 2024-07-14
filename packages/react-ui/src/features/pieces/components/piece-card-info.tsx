import React from "react"
import { PieceMetadataModelSummary } from "@activepieces/pieces-framework"

type PieceCardInfoProps = {
    piece: PieceMetadataModelSummary
}

const PieceCardInfo: React.FC<PieceCardInfoProps> = ({ piece }) => {
    return (
        <div className="flex gap-4 h-[110px] justify-center items-center border border-solid px-4 py-4 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground">
            <div className="flex h-full items-center justify-center min-w-[48px]">
                <img src={piece.logoUrl} className="object-contain w-[48px] h-[48px]" />
            </div>
            <div className="flex-grow flex flex-col gap-1 h-full">
                <div className="text-base ">{piece.displayName}</div>
                <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
                    {piece.description}
                </div>

            </div>
        </div>
    )
}

export { PieceCardInfo }