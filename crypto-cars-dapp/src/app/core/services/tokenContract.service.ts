declare let require: any;
import { defer } from 'rxjs';
import { ethers } from 'ethers';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';

const CarToken = require('../../contract_interfaces/CarToken.json');
const contractAddress = '0x8288ca5f69259b9d628a713ed1532f4ccc027eea';
const contractABI = CarToken.abi;

@Injectable()
export class TokenContractService {
  private deployedTokenContract: ethers.Contract;

  constructor(
    private providerService: ProviderService,
    private walletService: WalletService,
    private spinner: NgxSpinnerService) {
    this.deployedTokenContract = new ethers.Contract(contractAddress, contractABI, this.providerService.getProvider());
  }

  approve(accountAddress, amount: ethers.utils.BigNumber) {
    const connectedTokenContract = this.deployedTokenContract.connect(this.walletService.getWallet());
    return connectedTokenContract.approve(accountAddress, amount);
  }

  getTokenBalance(accountAddress) {
    return defer(async () => {
      this.spinner.show();
      const tokenBalace = await this.deployedTokenContract.balanceOf(accountAddress);
      this.spinner.hide();
      return ethers.utils.formatEther(tokenBalace);
    });
  }
}
