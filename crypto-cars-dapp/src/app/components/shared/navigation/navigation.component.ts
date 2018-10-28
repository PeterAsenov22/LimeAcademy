import { Component } from '@angular/core';
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
    private router: Router,
    private toastr: ToastrService) {
  }

  closeWallet() {
    this.walletService.closeWallet();
    this.router.navigate(['/']);
    this.toastr.success('Wallet closed successfully');
  }
}
