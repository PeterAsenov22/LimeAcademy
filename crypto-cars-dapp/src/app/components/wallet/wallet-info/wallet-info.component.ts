import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';
import { TokenContractService } from 'src/app/core/services/tokenContract.service';

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
  protected ethersBalance: string;
  protected carTokensBalance: string;

  constructor(
    private tokenContractService: TokenContractService,
    private walletService: WalletService) { }

  ngOnInit() {
    this.address = this.walletService.getAddress();
    this.privateKey = this.walletService.getPrivateKey();

    this.walletService
      .getBalance()
      .subscribe(ethers => this.ethersBalance = ethers);

    this.tokenContractService
      .getTokenBalance(this.address)
      .subscribe(tokens => this.carTokensBalance = tokens);
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
