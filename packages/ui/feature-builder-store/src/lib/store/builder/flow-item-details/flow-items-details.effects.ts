import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap, take } from 'rxjs';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItemDetailsActions } from './flow-items-details.action';
import { FlowItemDetails, PieceMetadataModel } from '@activepieces/ui/common';
import {
  PieceMetadataService,
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
} from '@activepieces/ui/feature-pieces';
@Injectable()
export class FlowItemsDetailsEffects {
  load$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowItemDetailsActions.loadFlowItemsDetails),
      switchMap(() => {
        const pieces$ = this.flowItemsDetailsService
          .getPiecesManifest()
          .pipe(take(1));
        const coreTriggersFlowItemsDetails$ = of(
          this.flowItemsDetailsService.triggerItemsDetails
        );
        const customPiecesTriggersFlowItemDetails$ = pieces$.pipe(
          map(this.createFlowItemDetailsForComponents(true))
        );
        const customPiecesActions$ = pieces$.pipe(
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
        let coreFlowItemsDetails = [...res.coreFlowItemsDetails];
        let coreTriggerFlowItemsDetails = [...res.coreTriggerFlowItemsDetails];
        const customPiecesActionsFlowItemDetails = [
          ...res.customPiecesActionsFlowItemDetails,
        ];
        const customPiecesTriggersFlowItemDetails = [
          ...res.customPiecesTriggersFlowItemDetails,
        ];
        coreFlowItemsDetails = this.moveCorePiecesToCoreFlowItemDetails(
          CORE_PIECES_ACTIONS_NAMES,
          customPiecesActionsFlowItemDetails,
          coreFlowItemsDetails
        );
        coreTriggerFlowItemsDetails = this.moveCorePiecesToCoreFlowItemDetails(
          CORE_PIECES_TRIGGERS,
          customPiecesTriggersFlowItemDetails,
          coreTriggerFlowItemsDetails
        );
        return {
          coreFlowItemsDetails,
          coreTriggerFlowItemsDetails,
          customPiecesActionsFlowItemDetails,
          customPiecesTriggersFlowItemDetails,
        };
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
        const index = source.findIndex((p) => p.extra?.pieceName === n);

        if (index < 0) {
          console.warn(`piece ${n} is not found`);
        }
        return index;
      })
      .filter((idx) => idx > -1);
    indicesOfPiecesInSource.forEach((idx) => {
      target = [...target, { ...source[idx] }];
    });
    piecesNamesToMove.forEach((pieceName) => {
      const index = source.findIndex((p) => p.extra?.pieceName === pieceName);
      // Remove the piece from the source if it is found
      if (index > 0) {
        source.splice(index, 1);
      }
    });
    return target.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  createFlowItemDetailsForComponents(forTriggers: boolean) {
    return (piecesManifest: PieceMetadataModel[]) => {
      return piecesManifest
        .map((piece) => {
          if (Object.keys(piece.actions).length > 0 && !forTriggers) {
            return new FlowItemDetails(
              ActionType.PIECE,
              piece.displayName,
              piece.description ? piece.description : ``,
              piece.logoUrl,
              {
                packageType: piece.packageType,
                pieceType: piece.pieceType,
                pieceName: piece.name,
                pieceVersion: piece.version,
                actionsOrTriggers: Object.keys(piece.actions).map((name) => {
                  return {
                    name,
                    displayName: piece.actions[name].displayName,
                  };
                }),
              }
            );
          } else if (Object.keys(piece.triggers).length > 0 && forTriggers) {
            return new FlowItemDetails(
              TriggerType.PIECE,
              piece.displayName,
              piece.description ? piece.description : ``,
              piece.logoUrl,
              {
                packageType: piece.packageType,
                pieceType: piece.pieceType,
                pieceName: piece.name,
                pieceVersion: piece.version,
                actionsOrTriggers: Object.keys(piece.triggers).map((name) => {
                  return {
                    name,
                    displayName: piece.triggers[name].displayName,
                  };
                }),
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
    private flowItemsDetailsService: PieceMetadataService
  ) {}
}
