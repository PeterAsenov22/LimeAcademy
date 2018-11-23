declare let require: any;
import { defer } from 'rxjs';
import { ethers } from 'ethers';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';

const CarToken = require('../../contract_interfaces/CarToken.json');
const contractAddress = '0x3983e158083198807702b3E809e0B48Cc78F75bF';
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
