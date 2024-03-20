import { DropdownState, PiecePropertyMap } from "@activepieces/pieces-framework";
import { Action, ActionType, AddPieceRequestBody, ListPiecesRequestQuery, PieceCategory, PieceOptionRequest, PieceScope, SuggestionType, Trigger, TriggerType, isNil, spreadIfDefined } from "@activepieces/shared";
import { AuthenticationService, FlowItemDetails, PieceMetadataModel, PieceMetadataModelSummary, environment } from "@activepieces/ui/common";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, map, of, shareReplay } from "rxjs";


@Injectable({
    providedIn: 'root',
})
export class PieceMetadataService {

    private CODE_ITEM_DETAILS = {
        type: ActionType.CODE,
        name: 'Code',
        description: 'Powerful nodejs & typescript code with npm',
        logoUrl: '/assets/img/custom/piece/code.svg',
    }

    private BRANCH_ITEM_DETAILS = {
        type: ActionType.BRANCH,
        name: 'Branch',
        description: 'Decide what happens based on an if condition result',
        logoUrl: '/assets/img/custom/piece/branch.svg',
    }

    private LOOP_ITEM_DETAILS = {
        type: ActionType.LOOP_ON_ITEMS,
        name: 'Loop',
        description: 'Loop on a list of items',
        logoUrl: '/assets/img/custom/piece/loop.svg',
    }

    private EMPTY_TRIGGER_ITEM_DETAILS = {
        type: TriggerType.EMPTY,
        name: 'Empty Trigger',
        description: 'Choose a trigger',
        logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
    }

    private CORE_ACTIONS_DETAILS: FlowItemDetails[] = [
        this.BRANCH_ITEM_DETAILS,
        this.LOOP_ITEM_DETAILS,
        this.CODE_ITEM_DETAILS
    ]
    private clearCache$ = new Subject<void>();
    private cachedPieceMetadata: { [key: string]: Observable<PieceMetadataModel> } = {};

    constructor(private authenticationService: AuthenticationService, private http: HttpClient) { }


    clearCache() {
        this.clearCache$.next();
    }

    listPieces(request: ListPiecesRequestQuery): Observable<PieceMetadataModelSummary[]> {
        return this.http.get<PieceMetadataModelSummary[]>(`${environment.apiUrl}/pieces`, {
            params: {
                includeHidden: request.includeHidden ? 'true' : 'false',
                ...spreadIfDefined('searchQuery', request.searchQuery),
                ...spreadIfDefined('suggestionType', !isNil(request.searchQuery) && request.searchQuery.length > 3 ? request.suggestionType : undefined)
            }
        });
    }

    listInstalledPieces(): Observable<PieceMetadataModelSummary[]> {
        return this.listPieces({
            includeHidden: false
        }).pipe(map(pieces => pieces.filter(piece => !isNil(piece.projectId))))
    }

    private listCorePieces(searchQuery: string | undefined, suggestionType: SuggestionType): Observable<PieceMetadataModelSummary[]> {
        return this.listPieces({
            includeHidden: false,
            searchQuery,
            suggestionType,
        }).pipe(map(pieces => pieces.filter(piece => piece.categories?.includes(PieceCategory.CORE))))
    }

    private listAppPieces(searchQuery: string | undefined, suggestionType: SuggestionType): Observable<PieceMetadataModelSummary[]> {
        return this.listPieces({
            includeHidden: false,
            searchQuery,
            suggestionType,
        }).pipe(map(pieces => pieces.filter(piece => !piece.categories?.includes(PieceCategory.CORE))))
    }

    private hasTriggers(piece: PieceMetadataModelSummary): boolean {
        return piece.triggers > 0;
    }

    private hasActions(piece: PieceMetadataModelSummary): boolean {
        return piece.actions > 0;
    }

    private convertToFlowItemDetails(piece: PieceMetadataModelSummary | PieceMetadataModel, type: TriggerType | ActionType): FlowItemDetails {
        const convertedPiece = piece as PieceMetadataModelSummary
        const suggestedActions = convertedPiece?.suggestedActions || [];
        const suggestedTriggers = convertedPiece?.suggestedTriggers || [];
        return {
            type: type,
            name: piece.displayName,
            description: piece.description,
            logoUrl: piece.logoUrl,
            extra: {
                packageType: piece.packageType,
                pieceType: piece.pieceType,
                pieceName: piece.name,
                pieceVersion: piece.version
            },
            suggestions: [
                ...suggestedActions.map(action => ({
                    name: action.name,
                    displayName: action.displayName,
                })),
                ...suggestedTriggers.map(trigger => ({
                    name: trigger.name,
                    displayName: trigger.displayName,
                }))
            ]
        }
    }

    private mergeWithCoreActions(searchQuery: string | undefined, pieces: FlowItemDetails[]): FlowItemDetails[] {
        if (!isNil(searchQuery) && searchQuery.length > 0) {
            return [...this.CORE_ACTIONS_DETAILS.filter(item =>
                item.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())
                || item.description.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())
            ),
            ...pieces];
        }
        return [...pieces, ...this.CORE_ACTIONS_DETAILS,];
    }

    listCoreFlowItemsDetailsForAction(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        const corePiecesAction$ = this.listCorePieces(searchQuery, SuggestionType.ACTION).pipe(map(pieces => pieces.filter(this.hasActions).map((p) => this.convertToFlowItemDetails(p, ActionType.PIECE))));
        return corePiecesAction$.pipe(map(pieces => this.mergeWithCoreActions(searchQuery, pieces)));
    }

    listCoreFlowItemsDetailsForTrigger(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        return this.listCorePieces(searchQuery, SuggestionType.TRIGGER).pipe(map(pieces => pieces.filter(this.hasTriggers).map((p) => this.convertToFlowItemDetails(p, TriggerType.PIECE))))
    }

    listAppFlowItemsDetailsForAction(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        return this.listAppPieces(searchQuery, SuggestionType.ACTION).pipe(map(pieces => pieces.filter(this.hasActions).map((p) => this.convertToFlowItemDetails(p, ActionType.PIECE))));
    }

    listAppFlowItemsDetailsForTrigger(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        return this.listAppPieces(searchQuery, SuggestionType.TRIGGER).pipe(map(pieces => pieces.filter(this.hasTriggers).map((p) => this.convertToFlowItemDetails(p, TriggerType.PIECE))));
    }

    listAllFlowItemsDetailsForAction(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        const items$ = this.listPieces({
            includeHidden: false,
            searchQuery,
            suggestionType: SuggestionType.ACTION
        }).pipe(map(pieces => pieces.filter(this.hasActions).map((p) => this.convertToFlowItemDetails(p, ActionType.PIECE))));
        return items$.pipe(map(pieces => this.mergeWithCoreActions(searchQuery, pieces)));
    }

    listAllFlowItemsDetailsForTrigger(searchQuery: string | undefined): Observable<FlowItemDetails[]> {
        return this.listPieces({
            includeHidden: false,
            searchQuery,
            suggestionType: SuggestionType.TRIGGER
        }).pipe(map(pieces => pieces.filter(this.hasTriggers).map((p) => this.convertToFlowItemDetails(p, TriggerType.PIECE))));
    }

    getPieceMetadata(name: string, version: string | undefined): Observable<PieceMetadataModel> {
        const cacheKey = `${name}_${version||'_latest'}`;

        if (!this.cachedPieceMetadata[cacheKey]) {
            this.cachedPieceMetadata[cacheKey] = this.http.get<PieceMetadataModel>(`${environment.apiUrl}/pieces/${name}`, {
                params: {
                    ...spreadIfDefined('version', version)
                }
            }).pipe(shareReplay(1));
        }
        return this.cachedPieceMetadata[cacheKey];
    }

    getPieceActionConfigOptions<T extends DropdownState<unknown> | PiecePropertyMap>(req: PieceOptionRequest) {
        return this.http.post<T>(environment.apiUrl + `/pieces/options`, req);
    }

    getStepDetails(step: Action | Trigger): Observable<FlowItemDetails> {
        switch (step.type) {
            case ActionType.BRANCH:
                return of(this.BRANCH_ITEM_DETAILS);
            case ActionType.CODE:
                return of(this.CODE_ITEM_DETAILS);
            case ActionType.LOOP_ON_ITEMS:
                return of(this.LOOP_ITEM_DETAILS);
            case TriggerType.EMPTY:
                return of(this.EMPTY_TRIGGER_ITEM_DETAILS);
            case TriggerType.PIECE:
            case ActionType.PIECE:
                return this.getPieceMetadata(step.settings.pieceName, step.settings.pieceVersion).pipe(map((p) => this.convertToFlowItemDetails(p, step.type)));
        }
    }

    getIconUrlForStep(step: Action | Trigger): Observable<string> {
        return this.getStepDetails(step).pipe(map(details => details.logoUrl!));
    }

    installCommunityPiece(params: AddPieceParams) {
        const formData = new FormData();
        formData.set('packageType', params.packageType);
        formData.set('pieceName', params.pieceName);
        formData.set('pieceVersion', params.pieceVersion);
        formData.set('scope', params.scope)
        if (params.scope === PieceScope.PROJECT) {
            formData.set('projectId', this.authenticationService.getProjectId())
        }
        if (params.pieceArchive) {
            formData.set('pieceArchive', params.pieceArchive);
        }
        return this.http.post<PieceMetadataModel>(`${environment.apiUrl}/pieces`,
            formData
        );
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/pieces/${id}`);
    }

}


type AddPieceParams = Omit<AddPieceRequestBody, 'pieceArchive'> & {
    pieceArchive: File | null;
};