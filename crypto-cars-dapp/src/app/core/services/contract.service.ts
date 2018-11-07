declare let require: any;
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import { defer } from 'rxjs';
import { Injectable } from '@angular/core';
import { IpfsService } from './ipfs.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProviderService } from './provider.service';
import { ToastrService } from 'ngx-toastr';
import { WalletService } from './wallet.service';
import { getBytes32FromIpfsHash } from '../../core/utils/helperFunctions';

const Cars = require('../../contract_interfaces/Cars.json');
const contractAddress = '0x367c06c29288A7FA63f7F29Dc484646D7f87689D';
const contractABI = Cars.abi;

@Injectable()
export class ContractService {
  private deployedContract: ethers.Contract;
  private contractOwner;

  constructor(
    private ipfsService: IpfsService,
    private walletService: WalletService,
    private providerService: ProviderService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) {
    this.deployedContract = new ethers.Contract(contractAddress, contractABI, this.providerService.getProvider());
    this.deployedContract
      .owner()
      .then(owner => this.contractOwner = owner);

    this.deployedContract.on('CarAddedByContractOwner', (index, makeInBytes, modelInBytes, price) => {
      const make = ethers.utils.parseBytes32String(makeInBytes);
      const model = ethers.utils.parseBytes32String(modelInBytes);
      const priceEth = ethers.utils.formatEther(price);
      this.toastr.success(`${make} ${model} added by contract owner. Initial pirce: ${priceEth} ETH`);
    });
  }

  getContractOwner() {
    return this.contractOwner;
  }

  createCar(make: string, model: string, initialPrice: ethers.utils.BigNumber, imageBuffer: Buffer) {
    return defer(async () => {
      try {
        this.spinner.show();
        const uploadResult = await this.ipfsService.addFile(imageBuffer);
        const wallet = this.walletService.getWallet();
        const connectedContract = this.deployedContract.connect(wallet);
        const makeInBytes = ethers.utils.formatBytes32String(make);
        const modelInBytes = ethers.utils.formatBytes32String(model);
        const imageInBytes = getBytes32FromIpfsHash(uploadResult[0].hash);
        const sentTransaction = await connectedContract.addCar(makeInBytes, modelInBytes, initialPrice, imageInBytes);
        this.spinner.hide();
        return sentTransaction.hash;
      } catch {
        this.toastr.error('Transaction failed!');
        this.spinner.hide();
        return undefined;
      }
    });
  }

  buyCar(index: number, amount: ethers.utils.BigNumber, isSecondHand: boolean) {
    return defer(async () => {
      try {
        this.spinner.show();
        const wallet = this.walletService.getWallet();
        const connectedContract = this.deployedContract.connect(wallet);

        let sentTransaction;
        if (isSecondHand) {
          sentTransaction = await connectedContract.buyCarFromSeller(index, {value: amount, gasPrice: 400000});
        } else {
          sentTransaction = await connectedContract.buyCarFromContractOwner(index, {value: amount, gasPrice: 400000});
        }

        this.providerService.getProvider().once(sentTransaction.hash, (receipt) => {
          const prototype = new ethers.utils.Interface(contractABI);
          const parsedLogs = prototype.parseLog(receipt.logs[0]);
          const values = parsedLogs.values;

          const make = ethers.utils.parseBytes32String(values._make);
          const model = ethers.utils.parseBytes32String(values._model);
          const price = ethers.utils.formatEther(values._price);
          this.toastr.success(`You have successfully bought ${make} ${model} for ${price} ETH`);
        });

        this.spinner.hide();
        return sentTransaction.hash;
      } catch {
        this.toastr.error('Transaction failed!');
        this.spinner.hide();
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
        car._id = i;
        allCarsResult.push(car);
      }

      this.spinner.hide();
      return allCarsResult;
    });
  }

  getCar(index: number) {
    return defer(async () => {
      try {
        this.spinner.show();
        const car = await this.deployedContract.getCarInfo(index);
        this.spinner.hide();
        return car;
      } catch {
        this.spinner.hide();
        return undefined;
      }
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
          car._id = index;
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
