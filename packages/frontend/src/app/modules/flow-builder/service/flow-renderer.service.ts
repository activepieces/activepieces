import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Point } from '../../common/model/helper/point';
import { AddButtonAndFlowItemNameContainer } from '../../common/model/flow-builder/flow-add-button';
import { FlowRenderUtil } from './flowRenderUtil';

import { FlowItem } from '../../common/model/flow-builder/flow-item';

@Injectable({
  providedIn: 'root',
})
export class FlowRendererService {
  debuggerNewDropPointSubject = new Subject<{ x: number; y: number }>();
  draggingSubject = new Subject<boolean>();
  public structureChanged: BehaviorSubject<FlowItem | undefined> =
    new BehaviorSubject<FlowItem | undefined>(undefined);
  public addButtonsWithStepNamesContainers: AddButtonAndFlowItemNameContainer[] =
    [];
  public rootPiece: FlowItem;
  public attachmentCandidate: BehaviorSubject<
    AddButtonAndFlowItemNameContainer | undefined
  > = new BehaviorSubject<AddButtonAndFlowItemNameContainer | undefined>(
    undefined
  );
  private droppedPiece: FlowItem | null;
  candidateAddButton: AddButtonAndFlowItemNameContainer | undefined;

  public getDraggedInformation(): {
    draggedPiece: FlowItem | null;
    candidateAddButton: AddButtonAndFlowItemNameContainer | undefined;
  } {
    return {
      draggedPiece: this.droppedPiece,
      candidateAddButton: this.candidateAddButton,
    };
  }

  public setDropPoint(point: Point, draggedPiece: FlowItem) {
    this.droppedPiece = draggedPiece;
    this.debuggerNewDropPointSubject.next(point);
    this.candidateAddButton = this.findCandidateButton(point);
  }

  public setDragPiece(draggedPiece: FlowItem) {
    this.droppedPiece = draggedPiece;
  }

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

  private findCandidateButton(
    dropPoint: Point
  ): AddButtonAndFlowItemNameContainer | undefined {
    let candidate: AddButtonAndFlowItemNameContainer | undefined = undefined;
    this.addButtonsWithStepNamesContainers.forEach((btn) => {
      if (btn.stepName !== this.droppedPiece?.name) {
        if (FlowRenderUtil.isButtonWithinCandidateDistance(btn, dropPoint)) {
          if (!candidate) {
            candidate = btn;
          } else {
            const distanceBetweenCandidateAndDropPoint = FlowRenderUtil.dist(
              dropPoint,
              candidate.htmlElementForButton.getBoundingClientRect()
            );
            const distanceBetweenBtnAndDropPoint = FlowRenderUtil.dist(
              dropPoint,
              btn.htmlElementForButton.getBoundingClientRect()
            );
            if (
              distanceBetweenBtnAndDropPoint <
              distanceBetweenCandidateAndDropPoint
            ) {
              candidate = btn;
            }
          }
        }
      }
    });

    return candidate;
  }
}
