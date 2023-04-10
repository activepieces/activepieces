import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FlowItem,
  FlowRendererService,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
})
export class FlowItemTreeComponent implements OnInit {
  activePiece$: Observable<FlowItem | undefined>;
  navbarOpen = false;

  constructor(private flowService: FlowRendererService) {}

  ngOnInit(): void {
    this.activePiece$ = this.flowService.structureChanged;
  }
}
