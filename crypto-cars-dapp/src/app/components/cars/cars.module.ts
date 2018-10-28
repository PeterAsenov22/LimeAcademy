import { CarsRoutingModule } from './cars.routing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { carsComponents } from '.';

@NgModule({
  declarations: [
    ...carsComponents
  ],
  imports: [
    CarsRoutingModule,
    CommonModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [
    ...carsComponents
  ]
})
export class CarsModule { }
