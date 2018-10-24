declare let require: any;
import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';

const Cars = require('../../contract_interfaces/Cars.json');

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected title = 'Crypto Cars';
  protected address: string;
  protected cars: any;

  private network = 'ropsten';
  private apiAccessToken = 'f8d2169f70584df396394ad9ce130289';
  private infuraProvider: ethers.providers.InfuraProvider;
  private contractAddress = '0xbaBc4122709eCA6828cE2651F08c17d246B8487B';
  private contractABI = Cars.abi;
  private deployedContract: ethers.Contract;

  ngOnInit() {
    this.infuraProvider = new ethers.providers.InfuraProvider(this.network, this.apiAccessToken);
    this.deployedContract = new ethers.Contract(this.contractAddress, this.contractABI, this.infuraProvider);
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

        this.cars = carsResult;
      })
      .catch(() => {
        this.cars = [];
      });
    }
  }
}
