import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// services
import { ContractService } from './contract.service';
import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';

@NgModule({
  providers: [
    ContractService,
    ProviderService,
    WalletService
  ],
  imports: [
    CommonModule
  ]
})
export class ServicesModule { }
