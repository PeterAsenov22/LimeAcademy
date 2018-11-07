import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { FormBuilder } from '@angular/forms';
import { WalletService } from 'src/app/core/services/wallet.service';
import { getIpfsHashFromBytes32 } from '../../../core/utils/helperFunctions';

@Component({
  selector: 'app-cars-all',
  templateUrl: './cars-all.component.html',
  styleUrls: ['./cars-all.component.css']
})
export class CarsAllComponent implements OnInit {
  protected filteredCars;
  protected ethers = ethers;
  protected filterForm;
  protected filters = ['All', 'New', 'Second-Hand'];
  private allCars;

  constructor(
    protected walletService: WalletService,
    private contractService: ContractService,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.filterForm = this.fb.group({
      filterControl: ['All']
    });

    this.onFilterChange();

    this.contractService
      .getAllCars()
      .subscribe(result => {
        this.allCars = result;
        this.filterCars(this.filter.value);
      });
  }

  get filter() {
    return this.filterForm.get('filterControl');
  }

  onFilterChange() {
    this.filter.valueChanges.subscribe(filter => {
      this.filterCars(filter);
    });
  }

  filterCars(filter: string) {
    switch (filter) {
      case 'All':
        this.filteredCars = this.allCars;
        break;
      case 'New':
        this.filteredCars = this.allCars.filter(c => c._isSecondHand === false);
        break;
      case 'Second-Hand':
        this.filteredCars = this.allCars.filter(c => c._isSecondHand === true);
    }
  }

  protected getIpfsHash(imageHash) {
    return getIpfsHashFromBytes32(imageHash);
  }
}
