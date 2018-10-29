import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuyCarComponent } from './buy-car/buy-car.component';
import { CarsAllComponent } from './cars-all/cars-all.component';
import { CreateCarComponent } from './create-car/create-car.component';

import { AuthGuard } from '../../core/guards/auth.guard';
import { OwnerGuard } from '../../core/guards/owner.guard';

const carsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'all' },
  { path: 'all', component: CarsAllComponent },
  { path: 'buy/:id', component: BuyCarComponent, canActivate: [AuthGuard] },
  { path: 'create', component: CreateCarComponent, canActivate: [OwnerGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class CarsRoutingModule { }
