import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectMembersComponent } from './project-members/project-members.component';
@NgModule({
  imports: [CommonModule],
  declarations: [ProjectMembersComponent],
  exports: [ProjectMembersComponent],
})
export class UiFeatureTeamsModule { }
