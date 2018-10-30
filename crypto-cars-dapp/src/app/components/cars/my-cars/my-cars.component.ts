import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { ethers } from 'ethers';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-my-cars',
  templateUrl: './my-cars.component.html'
})
export class MyCarsComponent implements OnInit {
  protected cars;
  protected totalMoneySpent;
  protected ethers = ethers;

  constructor(
    protected contractService: ContractService,
    protected walletService: WalletService) { }

  ngOnInit() {
    this.contractService
        .getAddressCars(this.walletService.getAddress())
        .subscribe(result => {
          this.cars = result.cars;
          this.totalMoneySpent = result.money;
        });
  }
}
