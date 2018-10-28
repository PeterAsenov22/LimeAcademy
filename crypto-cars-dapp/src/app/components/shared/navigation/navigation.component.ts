import { Component } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  constructor(
    protected walletService: WalletService,
    protected contractService: ContractService,
    private router: Router,
    private toastr: ToastrService) {
  }

  closeWallet() {
    this.walletService.closeWallet();
    this.router.navigate(['/']);
    this.toastr.success('Wallet closed successfully');
  }
}
