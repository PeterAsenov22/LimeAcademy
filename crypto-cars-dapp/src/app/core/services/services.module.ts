import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// services
import { ContractService } from './contract.service';
import { IpfsService } from './ipfs.service';
import { ProviderService } from './provider.service';
import { TokenContractService } from './tokenContract.service';
import { WalletService } from './wallet.service';

@NgModule({
  providers: [
    ContractService,
    IpfsService,
    ProviderService,
    TokenContractService,
    WalletService
  ],
  imports: [
    CommonModule
  ]
})
export class ServicesModule { }
