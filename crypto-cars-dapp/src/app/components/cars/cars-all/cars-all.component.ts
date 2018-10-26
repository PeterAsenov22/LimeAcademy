import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';

@Component({
  selector: 'app-cars-all',
  templateUrl: './cars-all.component.html',
  styleUrls: ['./cars-all.component.css']
})
export class CarsAllComponent implements OnInit {
  protected cars: any;
  protected ethers = ethers;

  constructor(
    private contractService: ContractService) { }

  ngOnInit() {
    this.contractService
      .getAllCars()
      .subscribe(result => {
        this.cars = result;
      });
  }
}
