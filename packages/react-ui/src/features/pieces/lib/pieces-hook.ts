
import { useQuery } from "@tanstack/react-query";
import { PieceMetadataModelSummary } from "@activepieces/pieces-framework";
import { piecesApi } from "./pieces-api";


type UsePieceProps = {
    name: string
    version?: string
}


export const piecesHooks = {
    usePiece: ({ name, version }: UsePieceProps) => {
        return useQuery<PieceMetadataModelSummary, Error>({
            queryKey: ['piece', name, version],
            queryFn: () => piecesApi.get({ name, version }),
        });
    }
}