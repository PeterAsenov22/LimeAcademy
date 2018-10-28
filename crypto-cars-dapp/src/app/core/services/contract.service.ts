declare let require: any;
import { ethers } from 'ethers';
import { defer } from 'rxjs';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProviderService } from './provider.service';
import { ToastrService } from 'ngx-toastr';
import { WalletService } from './wallet.service';

const Cars = require('../../contract_interfaces/Cars.json');
const contractAddress = '0x596f712b270ed0d7cedadcab6baa34bee878dbff';
const contractABI = Cars.abi;

@Injectable()
export class ContractService {
  private deployedContract: ethers.Contract;
  private contractOwner;

  constructor(
    private walletService: WalletService,
    private providerService: ProviderService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) {
    this.deployedContract = new ethers.Contract(contractAddress, contractABI, this.providerService.getProvider());
    this.deployedContract
      .owner()
      .then(owner => this.contractOwner = owner);

    this.deployedContract.on('CarAddedByContractOwner', (index, make, model, price) => {
      const priceEth = ethers.utils.formatEther(price);
      this.toastr.success(`${make} ${model} added by contract owner. Initial pirce: ${priceEth} ETH`);
    });
  }

  getContractOwner() {
    return this.contractOwner;
  }

  createCar(make: string, model: string, initialPrice: ethers.utils.BigNumber) {
    return defer(async () => {
      try {
        const wallet = this.walletService.getWallet();
        const connectedContract = this.deployedContract.connect(wallet);
        const sentTransaction = await connectedContract.addCar(make, model, initialPrice);
        return sentTransaction.hash;
      } catch {
        this.toastr.error('Transaction failed!');
        return undefined;
      }
    });
  }

  getAllCars() {
    return defer(async () => {
      this.spinner.show();
      const carsCount = await this.deployedContract.getCarsCount();

      const allCarsResult = [];
      for (let i = 0; i < carsCount.toNumber(); i++) {
        const car = await this.deployedContract.getCarInfo(i);
        allCarsResult.push(car);
      }

      this.spinner.hide();
      return allCarsResult;
    });
  }

  getAddressCars(address: string) {
    return defer(async () => {
      this.spinner.show();
      try {
        const carsIndexes = await this.deployedContract.getAddressCars(address);

        const carsResult = [];
        for (const index of carsIndexes) {
          const car = await this.deployedContract.getCarInfo(index.toNumber());
          carsResult.push(car);
        }

        const totalMoneySpent = await this.deployedContract.getTotalSpendingsByAddress(address);
        this.spinner.hide();
        return {
          cars: carsResult,
          money: ethers.utils.formatEther(totalMoneySpent)
        };
      } catch {
        this.spinner.hide();
        return {
          cars: [],
          money: ethers.utils.formatEther(0)
        };
      }
    });
  }
}
