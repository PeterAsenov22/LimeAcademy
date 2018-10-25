import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CarsAllComponent } from './cars-all/cars-all.component';


const carsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'all' },
  { path: 'all', component: CarsAllComponent }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class CarsRoutingModule { }
