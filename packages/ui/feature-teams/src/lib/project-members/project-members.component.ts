import { Component } from '@angular/core';

@Component({
  selector: 'activepieces-project-members',
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.scss'],
})
export class ProjectMembersComponent {

  displayedColumns = [
    'user',
    'flowName',
    'status',
    'started',
    'finished',
  ];
  
}
