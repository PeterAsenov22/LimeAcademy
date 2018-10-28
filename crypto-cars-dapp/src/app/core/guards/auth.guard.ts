import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WalletService } from '../services/wallet.service';

@Injectable({
 providedIn: 'root'
})
export class AuthGuard implements CanActivate {

 constructor(
   private walletService: WalletService,
   private router: Router) { }

 canActivate(
   next: ActivatedRouteSnapshot,
   state: RouterStateSnapshot ): Observable<boolean> | Promise<boolean> | boolean {

   if (this.walletService.isWalletLoaded()) {
     return true;
   }

   this.router.navigate(['/wallet/open']);
   return false;
 }
}
