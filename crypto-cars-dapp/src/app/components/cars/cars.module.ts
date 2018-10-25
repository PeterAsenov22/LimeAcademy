import { CarsRoutingModule } from './cars.routing';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { carsComponents } from '.';

@NgModule({
  declarations: [
    ...carsComponents
  ],
  imports: [
    CarsRoutingModule,
    CommonModule
  ],
  exports: [
    ...carsComponents
  ]
})
export class CarsModule { }
