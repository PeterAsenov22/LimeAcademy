import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-info',
  templateUrl: './wallet-info.component.html',
  styleUrls: ['./wallet-info.component.css']
})
export class WalletInfoComponent implements OnInit {
  protected privateKeyInputType = 'password';
  protected eyeIcon = 'far fa-eye';
  protected address: string;
  protected privateKey: string;
  protected balance;

  constructor(private walletService: WalletService) { }

  ngOnInit() {
    this.address = this.walletService.getAddress();
    this.privateKey = this.walletService.getPrivateKey();
    this.walletService
      .getBalance()
      .subscribe(balance => this.balance = balance);
  }

  hideShowPk() {
    if (this.privateKeyInputType === 'password') {
      this.privateKeyInputType = 'text';
      this.eyeIcon = 'far fa-eye-slash';
    } else if (this.privateKeyInputType === 'text') {
      this.privateKeyInputType = 'password';
      this.eyeIcon = 'far fa-eye';
    }
  }
}
