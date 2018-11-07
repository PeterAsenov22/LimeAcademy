import * as ethers from 'ethers';
import { getIpfsHashFromBytes32 } from '../../../core/utils/helperFunctions';
import { Component, Input } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-cars-list',
  templateUrl: './cars-list.component.html',
  styleUrls: ['./cars-list.component.css']
})
export class CarsListComponent {
  @Input() protected cars;
  protected ethers = ethers;

  constructor(protected walletService: WalletService) { }

  protected getIpfsHash(imageHash) {
    return getIpfsHashFromBytes32(imageHash);
  }
}
