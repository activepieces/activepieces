import { Input } from "@/components/ui/input";
import { PieceCardInfo } from "./piece-card-info";
import { ScrollArea } from "@/components/ui/scroll-area";
import { piecesHooks } from "../lib/pieces-hook";
import { useDebounce } from "use-debounce";
import { LoadingSpinner } from "@/components/ui/spinner";

const PieceSelectorList = () => {

    const [searchQuery, setSearchQuery] = useDebounce<string>('', 300);
    const { data: pieces, isLoading } = piecesHooks.usePieces({
        searchQuery,
    });

    return (
        <div className="flex flex-col p-4 gap-4 h-full">
            <div className="text-lg font-semibold">Select Step</div>
            <div className="w-full">
                <Input type="text" placeholder="Search for a piece" onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {isLoading && <div className="h-full justify-center items-center text-center flex flex-grow"><LoadingSpinner/></div>}
            {pieces && pieces.length === 0 && <div className="h-full justify-center items-center text-center flex flex-grow">No pieces found</div>}
            {!isLoading && pieces && pieces.length > 0 &&
                <ScrollArea >
                    <div className="flex flex-col gap-4 h-max">
                        {pieces && pieces.map((piece) => (
                            <PieceCardInfo piece={piece} key={piece.name} />
                        ))}
                    </div>
                </ScrollArea>}

        </div >
    )
}

export { PieceSelectorList }