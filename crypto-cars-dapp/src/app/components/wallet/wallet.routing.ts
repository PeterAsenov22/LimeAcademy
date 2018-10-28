import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { OpenWalletComponent } from './open-wallet/open-wallet.component';
import { WalletInfoComponent } from './wallet-info/wallet-info.component';

import { AuthGuard } from '../../core/guards/auth.guard';

const carsRoutes: Routes = [
  { path: 'create', component: CreateWalletComponent },
  { path: 'open', component: OpenWalletComponent },
  { path: 'info', component: WalletInfoComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
