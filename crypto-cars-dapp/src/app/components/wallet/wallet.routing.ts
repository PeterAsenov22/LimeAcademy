import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateWalletComponent } from './create-wallet/create-wallet.component';

const carsRoutes: Routes = [
  { path: 'create', component: CreateWalletComponent }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
