import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';
import { connectionSettings } from '../../../app.connection.settings';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-cars-all',
  templateUrl: './cars-all.component.html',
  styleUrls: ['./cars-all.component.css']
})
export class CarsAllComponent implements OnInit {
  protected cars: any;
  protected ethers = ethers;

  private infuraProvider: ethers.providers.InfuraProvider;
  private deployedContract: ethers.Contract;

  constructor(private spinner: NgxSpinnerService) { }

  ngOnInit() {
    this.infuraProvider = new ethers.providers.InfuraProvider(connectionSettings.network, connectionSettings.apiAccessToken);
    this.deployedContract = new ethers.Contract(connectionSettings.contractAddress, connectionSettings.contractABI, this.infuraProvider);
    this.getCars();
  }

  private async getCars() {
    this.spinner.show();
    const carsCount = await this.deployedContract.getCarsCount();

    const allCarsResult = [];
    for (let i = 0; i < carsCount.toNumber(); i++) {
      const car = await this.deployedContract.getCarInfo(i);
      allCarsResult.push(car);
    }

    this.cars = allCarsResult;
    this.spinner.hide();
  }
}
