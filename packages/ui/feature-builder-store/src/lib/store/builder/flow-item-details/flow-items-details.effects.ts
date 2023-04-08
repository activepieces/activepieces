import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItemDetailsActions } from './flow-items-details.action';
import { ActionMetaService, FlowItemDetails } from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';

export const CORE_PIECES_ACTIONS_NAMES = [
  'store',
  'data-mapper',
  'connections',
  'delay',
  'http',
];
export const CORE_PIECES_TRIGGERS = ['schedule'];
@Injectable()
export class FlowItemsDetailsEffects {
  load$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowItemDetailsActions.loadFlowItemsDetails),
      switchMap(() => {
        const components$ = this.flowItemsDetailsService.getPiecesManifest();
        const coreTriggersFlowItemsDetails$ = of(
          this.flowItemsDetailsService.triggerItemsDetails
        );
        const customPiecesTriggersFlowItemDetails$ = components$.pipe(
          map(this.createFlowItemDetailsForComponents(true))
        );
        const customPiecesActions$ = components$.pipe(
          map(this.createFlowItemDetailsForComponents(false))
        );
        const coreFlowItemsDetails$ = of(
          this.flowItemsDetailsService.coreFlowItemsDetails
        );
        return forkJoin({
          coreFlowItemsDetails: coreFlowItemsDetails$,
          coreTriggerFlowItemsDetails: coreTriggersFlowItemsDetails$,
          customPiecesActionsFlowItemDetails: customPiecesActions$,
          customPiecesTriggersFlowItemDetails:
            customPiecesTriggersFlowItemDetails$,
        });
      }),
      map((res) => {
        res.coreFlowItemsDetails = this.moveCorePiecesToCoreFlowItemDetails(
          CORE_PIECES_ACTIONS_NAMES,
          res.customPiecesActionsFlowItemDetails,
          res.coreFlowItemsDetails
        );
        res.coreTriggerFlowItemsDetails =
          this.moveCorePiecesToCoreFlowItemDetails(
            CORE_PIECES_TRIGGERS,
            res.customPiecesTriggersFlowItemDetails,
            res.coreTriggerFlowItemsDetails
          );
        return res;
      }),
      switchMap((res) => {
        return of(
          FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully({
            flowItemsDetailsLoaded: { ...res, loaded: true },
          })
        );
      })
    );
  });

  private moveCorePiecesToCoreFlowItemDetails(
    piecesNamesToMove: string[],
    source: FlowItemDetails[],
    target: FlowItemDetails[]
  ) {
    const indicesOfPiecesInSource = piecesNamesToMove
      .map((n) => {
        const index = source.findIndex((p) => p.extra?.appName === n);

        if (index < 0) {
          console.error(`piece ${n} is not found`);
        }
        return index;
      })
      .filter((idx) => idx > -1);
    indicesOfPiecesInSource.forEach((idx) => {
      target = [...target, { ...source[idx] }];
    });
    piecesNamesToMove.forEach((pieceName) => {
      const index = source.findIndex((p) => p.extra?.appName === pieceName);
      source.splice(index, 1);
      return index;
    });
    return target.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  createFlowItemDetailsForComponents(forTriggers: boolean) {
    return (piecesManifest: PieceMetadataSummary[]) => {
      return piecesManifest
        .map((piece) => {
          if (piece.actions > 0 && !forTriggers) {
            return new FlowItemDetails(
              ActionType.PIECE,
              piece.displayName,
              piece.description ? piece.description : ``,
              piece.logoUrl,
              {
                appName: piece.name,
                appVersion: piece.version,
              }
            );
          } else if (piece.triggers > 0 && forTriggers) {
            return new FlowItemDetails(
              TriggerType.PIECE,
              piece.displayName,
              piece.description ? piece.description : ``,
              piece.logoUrl,
              {
                appName: piece.name,
                appVersion: piece.version,
              }
            );
          } else {
            return null;
          }
        })
        .filter((res) => res !== null) as FlowItemDetails[];
    };
  }
  constructor(
    private actions$: Actions,
    private flowItemsDetailsService: ActionMetaService
  ) {}
}
