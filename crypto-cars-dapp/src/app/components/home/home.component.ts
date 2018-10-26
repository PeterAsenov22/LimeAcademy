import * as ethers from 'ethers';
import { Component } from '@angular/core';
import { ContractService } from '../../core/services/contract.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  protected title = 'Crypto Cars';
  protected address: string;
  protected addressTotalMoneySpent: string;
  protected cars: any;
  protected ethers = ethers;

  constructor(
    private contractService: ContractService) { }

  getAddressCars() {
    if (this.address) {
      this.contractService
        .getAddressCars(this.address)
        .subscribe(result => {
          this.cars = result.cars;
          this.addressTotalMoneySpent = result.money;
        });
    }
  }
}
