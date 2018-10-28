import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AuthGuard } from './auth.guard';

@NgModule({
  providers: [ AuthGuard ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
