import { CarsModule } from './components/cars/cars.module';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletModule } from './components/wallet/wallet.module';

// Components
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/shared/not-found/not-found.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'cars', loadChildren: () => CarsModule },
  { path: 'wallet', loadChildren: () => WalletModule },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
