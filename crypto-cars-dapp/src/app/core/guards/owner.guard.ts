import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ContractService } from '../services/contract.service';
import { WalletService } from '../services/wallet.service';

@Injectable({
 providedIn: 'root'
})
export class OwnerGuard implements CanActivate {
  constructor(
   private contractService: ContractService,
   private walletService: WalletService,
   private router: Router) {
  }

 canActivate(
   next: ActivatedRouteSnapshot,
   state: RouterStateSnapshot ): Observable<boolean> | Promise<boolean> | boolean {
   if (this.walletService.isWalletLoaded()
      && this.walletService.getAddress() === this.contractService.getContractOwner()) {
     return true;
   }

   this.router.navigate(['/wallet/open']);
   return false;
  }
}
