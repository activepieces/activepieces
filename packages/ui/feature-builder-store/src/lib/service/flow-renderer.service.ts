import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { AddButtonAndFlowItemNameContainer } from '../model/flow-add-button';
import { FlowItem } from '../model/flow-item';
import { FlowRenderUtil } from '../utils/flowRenderUtil';

@Injectable({
  providedIn: 'root',
})
export class FlowRendererService {
  clientX = 0;
  clientY = 0;
  debuggerNewDropPointSubject = new Subject<{ x: number; y: number }>();
  readonly INVALID_DROP_MESSAGE = "Can't Move here";
  draggingSubject = new BehaviorSubject<boolean>(false);
  public structureChanged: BehaviorSubject<FlowItem | undefined> =
    new BehaviorSubject<FlowItem | undefined>(undefined);
  public addButtonsWithStepNamesContainers: AddButtonAndFlowItemNameContainer[] =
    [];
  public rootPiece: FlowItem;

  public refreshCoordinatesAndSetActivePiece(
    clonedActivePiece: FlowItem | undefined
  ): void {
    if (clonedActivePiece) {
      clonedActivePiece.xOffset = clonedActivePiece.yOffset = 0;
      this.rootPiece = clonedActivePiece;
      FlowRenderUtil.buildBoxes(clonedActivePiece);
      FlowRenderUtil.buildCoordinates(clonedActivePiece);
    }

    this.structureChanged.next(clonedActivePiece);
  }
}
