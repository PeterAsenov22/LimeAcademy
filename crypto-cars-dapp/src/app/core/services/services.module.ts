import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// services
import { ContractService } from './contract.service';

@NgModule({
  providers: [
    ContractService
  ],
  imports: [
    CommonModule
  ]
})
export class ServicesModule { }
