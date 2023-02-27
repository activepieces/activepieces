import { Component, OnInit } from '@angular/core';
import { FlowRendererService } from '../../../service/flow-renderer.service';
import { FlowItem } from '../../../../common/model/flow-builder/flow-item';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
  styleUrls: [],
})
export class FlowItemTreeComponent implements OnInit {
  activePiece$: Observable<FlowItem | undefined>;
  navbarOpen = false;

  constructor(private flowService: FlowRendererService) {}

  ngOnInit(): void {
    this.activePiece$ = this.flowService.structureChanged;
  }
}
