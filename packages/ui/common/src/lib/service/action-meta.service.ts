import { Injectable } from '@angular/core';
import {
  ActionType,
  ApEdition,
  ApEnvironment,
  compareSemVer,
  PieceOptionRequest,
  TriggerType,
} from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, map, forkJoin } from 'rxjs';
import { environment } from '../environments/environment';
import { FlowItemDetails } from '../models/flow-item-details';
import { FlagService } from './flag.service';
import {
  DropdownState,
  PiecePropertyMap,
  TriggerStrategy,
  TriggerBase,
  PieceMetadata,
  PieceMetadataSummary,
} from '@activepieces/pieces-framework';

type TriggersMetadata = Record<string, TriggerBase>;

type FilterUnSupportedPiecesParams = {
  piecesManifest: PieceMetadataSummary[];
  release: string;
  environment: string;
};
export const CORE_PIECES_ACTIONS_NAMES = [
  'store',
  'data-mapper',
  'connections',
  'delay',
  'http',
  'smtp',
];
export const corePieceIconUrl = (pieceName: string) =>
  `assets/img/custom/piece/${pieceName}_mention.png`;
export const CORE_PIECES_TRIGGERS = ['schedule'];
@Injectable({
  providedIn: 'root',
})
export class ActionMetaService {
  private release$ = this.flagsService.getRelease().pipe(shareReplay(1));

  private piecesManifest$ = this.http
    .get<PieceMetadataSummary[]>(`${environment.apiUrl}/pieces`)
    .pipe(shareReplay(1));

  private piecesCache = new Map<string, Observable<PieceMetadata>>();

  private edition$ = this.flagsService.getEdition();

  public coreFlowItemsDetails: FlowItemDetails[] = [
    {
      type: ActionType.CODE,
      name: 'Code',
      description: 'Powerful nodejs & typescript code with npm',
      logoUrl: '/assets/img/custom/piece/code.svg',
    },
    {
      type: ActionType.BRANCH,
      name: 'Branch',
      description: 'Decide what happens based on an if condition result',
      logoUrl: '/assets/img/custom/piece/branch.svg',
    },
    {
      type: ActionType.LOOP_ON_ITEMS,
      name: 'Loop',
      description: 'Loop on a list of items',
      logoUrl: '/assets/img/custom/piece/loop.svg',
    },
  ];

  public triggerItemsDetails: FlowItemDetails[] = [
    {
      type: TriggerType.WEBHOOK,
      name: 'Webhook',
      description: 'Trigger flow by calling a unique web url',
      logoUrl: '/assets/img/custom/piece/webhook.svg',
    },
    {
      type: TriggerType.EMPTY,
      name: 'Trigger',
      description: 'Choose a trigger',
      logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
    },
  ];

  constructor(private http: HttpClient, private flagsService: FlagService) {}

  private filterUnSupportedPieces = (params: FilterUnSupportedPiecesParams) => {
    const { piecesManifest, release } = params;

    return piecesManifest.filter((piece) => {
      if (params.environment === ApEnvironment.DEVELOPMENT) {
        return true;
      }
      const minRelease = piece.minimumSupportedRelease;
      const maxRelease = piece.maximumSupportedRelease;
      if (minRelease && compareSemVer(release, minRelease) === -1) {
        return false;
      } else if (maxRelease && compareSemVer(release, maxRelease) === 1) {
        return false;
      } else {
        return true;
      }
    });
  };

  private getCacheKey(pieceName: string, pieceVersion: string): string {
    return `${pieceName}-${pieceVersion}`;
  }

  private filterAppWebhooks(
    triggersMap: TriggersMetadata,
    edition: ApEdition
  ): TriggersMetadata {
    if (edition === ApEdition.ENTERPRISE) {
      return triggersMap;
    }

    const triggersList = Object.entries(triggersMap);

    const filteredTriggersList = triggersList.filter(
      ([, trigger]) => trigger.type !== TriggerStrategy.APP_WEBHOOK
    );

    return Object.fromEntries(filteredTriggersList);
  }

  private fetchPieceMetadata(
    pieceName: string,
    pieceVersion: string
  ): Observable<PieceMetadata> {
    return this.http.get<PieceMetadata>(
      `${environment.apiUrl}/pieces/${pieceName}?version=${pieceVersion}`
    );
  }

  getPiecesManifest(): Observable<PieceMetadataSummary[]> {
    return forkJoin({
      piecesManifest: this.piecesManifest$,
      environment: this.flagsService.getEnvironment(),
      release: this.release$,
    }).pipe(map(this.filterUnSupportedPieces), shareReplay(1));
  }

  getPieceMetadata(
    pieceName: string,
    pieceVersion: string
  ): Observable<PieceMetadata> {
    const cacheKey = this.getCacheKey(pieceName, pieceVersion);

    if (this.piecesCache.has(cacheKey)) {
      return this.piecesCache.get(cacheKey)!;
    }

    const pieceMetadata$ = forkJoin({
      pieceMetadata: this.fetchPieceMetadata(pieceName, pieceVersion),
      edition: this.edition$,
    }).pipe(
      map(({ pieceMetadata, edition }) => {
        pieceMetadata.triggers = this.filterAppWebhooks(
          pieceMetadata.triggers,
          edition
        );
        return pieceMetadata;
      }),
      shareReplay(1)
    );

    this.piecesCache.set(cacheKey, pieceMetadata$);
    return this.piecesCache.get(cacheKey)!;
  }

  getPieceActionConfigOptions<
    T extends DropdownState<unknown> | PiecePropertyMap
  >(req: PieceOptionRequest, pieceName: string) {
    return this.http.post<T>(
      environment.apiUrl + `/pieces/${pieceName}/options`,
      req
    );
  }
}
