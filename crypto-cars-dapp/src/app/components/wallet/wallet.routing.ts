import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { OpenWalletComponent } from './open-wallet/open-wallet.component';

const carsRoutes: Routes = [
  { path: 'create', component: CreateWalletComponent },
  { path: 'open', component: OpenWalletComponent }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
