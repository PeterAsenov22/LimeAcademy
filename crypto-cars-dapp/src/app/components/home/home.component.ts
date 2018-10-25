import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';
import { connectionSettings } from '../../app.connection.settings';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected title = 'Crypto Cars';
  protected address: string;
  protected addressTotalMoneySpent: string;
  protected cars: any;
  protected ethers = ethers;

  private infuraProvider: ethers.providers.InfuraProvider;
  private deployedContract: ethers.Contract;

  ngOnInit() {
    this.infuraProvider = new ethers.providers.InfuraProvider(connectionSettings.network, connectionSettings.apiAccessToken);
    this.deployedContract = new ethers.Contract(connectionSettings.contractAddress, connectionSettings.contractABI, this.infuraProvider);
  }

  getAddressCars() {
    if (this.address) {
      this.deployedContract
      .getAddressCars(this.address.trim())
      .then(async (results) => {
        const carsResult = [];
        for (const result of results) {
          const car = await this.deployedContract.getCarInfo(result.toNumber());
          carsResult.push(car);
        }

        const moneySpent = await this.deployedContract.getTotalSpendingsByAddress(this.address);
        this.addressTotalMoneySpent = ethers.utils.formatEther(moneySpent);
        this.cars = carsResult;
      })
      .catch(() => {
        this.cars = [];
        this.addressTotalMoneySpent = '0.0';
      });
    }
  }
}
