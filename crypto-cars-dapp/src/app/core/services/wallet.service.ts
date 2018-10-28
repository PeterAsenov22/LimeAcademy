import { ethers } from 'ethers';
import { Injectable } from '@angular/core';

@Injectable()
export class WalletService {
  private wallet: ethers.Wallet;

  loadWallet(wallet: ethers.Wallet) {
    this.wallet = wallet;
  }

  isWalletLoaded(): boolean {
    if (this.wallet) {
      return true;
    }

    return false;
  }

  closeWallet() {
    this.wallet = undefined;
  }
}
