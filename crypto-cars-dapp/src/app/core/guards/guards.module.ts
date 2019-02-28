import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AuthGuard } from './auth.guard';
import { OwnerGuard } from './owner.guard';

@NgModule({
  providers: [ AuthGuard, OwnerGuard ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
