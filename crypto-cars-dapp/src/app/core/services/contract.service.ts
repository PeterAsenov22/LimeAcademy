declare let require: any;
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import { defer } from 'rxjs';
import { Injectable } from '@angular/core';
import { IpfsService } from './ipfs.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProviderService } from './provider.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TokenContractService } from '../services/tokenContract.service';
import { WalletService } from './wallet.service';
import { getBytes32FromIpfsHash } from '../../core/utils/helperFunctions';

const Cars = require('../../contract_interfaces/Cars.json');
const contractAddress = '0xb637F7e2f072002CF91B64a6dF3a1937eCD1d668';
const contractABI = Cars.abi;

@Injectable()
export class ContractService {
  private deployedContract: ethers.Contract;
  private contractOwner;

  constructor(
    private tokenContractService: TokenContractService,
    private ipfsService: IpfsService,
    private walletService: WalletService,
    private providerService: ProviderService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private router: Router) {
    this.deployedContract = new ethers.Contract(contractAddress, contractABI, this.providerService.getProvider());
    this.deployedContract
      .owner()
      .then(owner => this.contractOwner = owner);

    this.deployedContract.on('CarAddedByContractOwner', (index, makeInBytes, modelInBytes, price) => {
      const make = ethers.utils.parseBytes32String(makeInBytes);
      const model = ethers.utils.parseBytes32String(modelInBytes);
      const priceCt = ethers.utils.formatEther(price);
      this.toastr.success(`${make} ${model} added by contract owner. Initial pirce: ${priceCt} CT`);
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
        const approveTransaction = await this.tokenContractService.approve(contractAddress, amount);
        this.spinner.hide();
        this.toastr.success('Your transaction is being processed...');
        this.router.navigate(['/']);

        const transactionReceipt = await approveTransaction.wait();
        if (transactionReceipt.status === 0) {
          this.toastr.error('Transaction failed!');
          this.spinner.hide();
          return undefined;
        }

        const wallet = this.walletService.getWallet();
        const connectedContract = this.deployedContract.connect(wallet);

        let sentTransaction;
        if (isSecondHand) {
          sentTransaction = await connectedContract.buyCarFromSeller(index, amount, {gasLimit: 400000});
        } else {
          sentTransaction = await connectedContract.buyCarFromContractOwner(index, amount, {gasLimit: 400000});
        }

        this.providerService.getProvider().once(sentTransaction.hash, (receipt) => {
          const prototype = new ethers.utils.Interface(contractABI);
          const log = receipt.logs.filter(_log => _log.address === contractAddress)[0];
          const parsedLogs = prototype.parseLog(log);
          const values = parsedLogs.values;

          const make = ethers.utils.parseBytes32String(values._make);
          const model = ethers.utils.parseBytes32String(values._model);
          const price = ethers.utils.formatEther(values._price);
          this.toastr.success(`You have successfully bought ${make} ${model} for ${price} CT`);
        });

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

        const totalTokensSpent = await this.deployedContract.getTotalSpendingsByAddress(address);
        this.spinner.hide();
        return {
          cars: carsResult,
          tokens: ethers.utils.formatEther(totalTokensSpent)
        };
      } catch {
        this.spinner.hide();
        return {
          cars: [],
          tokens: ethers.utils.formatEther(0)
        };
      }
    });
  }
}
