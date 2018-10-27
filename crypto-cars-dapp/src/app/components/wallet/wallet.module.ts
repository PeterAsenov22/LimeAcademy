import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WalletRoutingModule } from './wallet.routing';

import { walletComponents } from '.';

@NgModule({
  declarations: [
    ...walletComponents
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    WalletRoutingModule
  ],
  exports: [
    ...walletComponents
  ]
})
export class WalletModule { }
