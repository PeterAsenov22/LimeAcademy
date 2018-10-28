import { NgModule } from '@angular/core';
import { OwnerGuard } from '../../core/guards/owner.guard';
import { RouterModule, Routes } from '@angular/router';

import { CarsAllComponent } from './cars-all/cars-all.component';
import { CreateCarComponent } from './create-car/create-car.component';

const carsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'all' },
  { path: 'all', component: CarsAllComponent },
  { path: 'create', component: CreateCarComponent, canActivate: [OwnerGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class CarsRoutingModule { }
