

export function PieceIcon({ pieceName }: { pieceName: String }) {
    return <>
        <div className="ap-p-2 ap-rounded-full ap-border ap-border-solid ap-border-dividers ap-flex ap-items-center ap-justify-center ap-bg-white ap-w-[36px] ap-h-[36px]">
            <img src={`https://cdn.activepieces.com/pieces/webhook.svg`} className="ap-object-contain" />
        </div>
    </>
}