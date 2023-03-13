import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap } from 'rxjs';
import {
  ActionType,
  PieceMetadataSummary,
  TriggerType,
} from '@activepieces/shared';
import { FlowItemDetails } from '../../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionMetaService } from '../../../service/action-meta.service';
import { FlowItemDetailsActions } from './flow-items-details.action';

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
        const storagePiece = res.customPiecesActionsFlowItemDetails.find(
          (p) => p.extra?.appName === 'storage'
        );
        const httpPiece = res.customPiecesActionsFlowItemDetails.find(
          (p) => p.extra?.appName === 'http'
        );
        if (storagePiece) {
          res.coreFlowItemsDetails = [
            ...res.coreFlowItemsDetails,
            storagePiece,
          ];
          const index = res.customPiecesActionsFlowItemDetails.findIndex(
            (p) => p.extra?.appName === 'storage'
          );
          res.customPiecesActionsFlowItemDetails.splice(index, 1);
        }
        if (httpPiece) {
          res.coreFlowItemsDetails = [...res.coreFlowItemsDetails, httpPiece];
          const index = res.customPiecesActionsFlowItemDetails.findIndex(
            (p) => p.extra?.appName === 'http'
          );
          res.customPiecesActionsFlowItemDetails.splice(index, 1);
        }
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
              ``,
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
