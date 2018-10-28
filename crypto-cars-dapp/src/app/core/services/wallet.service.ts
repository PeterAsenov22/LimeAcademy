import { defer } from 'rxjs';
import { ethers } from 'ethers';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable()
export class WalletService {
  private wallet: ethers.Wallet;

  constructor(private spinner: NgxSpinnerService) {
  }

  loadWallet(wallet: ethers.Wallet) {
    this.wallet = wallet;
  }

  isWalletLoaded(): boolean {
    if (this.wallet) {
      return true;
    }

    return false;
  }

  getWallet(): ethers.Wallet {
    return this.wallet;
  }

  closeWallet() {
    this.wallet = undefined;
  }

  getAddress(): string {
    return this.wallet.address;
  }

  getPrivateKey(): string {
    return this.wallet.privateKey;
  }

  getBalance() {
    return defer(async () => {
      this.spinner.show();
      const balance = await this.wallet.getBalance();
      this.spinner.hide();
      return ethers.utils.formatEther(balance);
    });
  }
}
