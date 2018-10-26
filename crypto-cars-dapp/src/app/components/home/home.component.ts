import * as ethers from 'ethers';
import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../core/services/contract.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected title = 'Crypto Cars';
  protected checkAddressForm;
  protected addressTotalMoneySpent: string;
  protected cars: any;
  protected ethers = ethers;

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService) { }

  ngOnInit() {
    this.checkAddressForm = this.fb.group({
      address: ['', [Validators.required, Validators.pattern('^0x[A-Za-z0-9]{40}$')]]
    });
  }

  get address () {
    return this.checkAddressForm.get('address');
  }

  getAddressCars() {
    if (this.checkAddressForm.invalid) {
      return;
    }

    this.contractService
        .getAddressCars(this.address.value)
        .subscribe(result => {
          this.cars = result.cars;
          this.addressTotalMoneySpent = result.money;
        });
  }
}
