import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// services
import { ContractService } from './contract.service';
import { IpfsService } from './ipfs.service';
import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';

@NgModule({
  providers: [
    ContractService,
    IpfsService,
    ProviderService,
    WalletService
  ],
  imports: [
    CommonModule
  ]
})
export class ServicesModule { }
