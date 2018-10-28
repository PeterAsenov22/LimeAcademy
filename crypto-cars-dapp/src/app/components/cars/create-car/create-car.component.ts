import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ethers } from 'ethers';

@Component({
  selector: 'app-create-car',
  templateUrl: './create-car.component.html'
})
export class CreateCarComponent implements OnInit {
  protected createCarForm;
  protected showAlert;
  protected txHash;

  constructor(
    private contractService: ContractService,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.createCarForm = this.fb.group({
      make: ['', [Validators.required, Validators.maxLength(20)]],
      model: ['', [Validators.required, Validators.maxLength(20)]],
      initialPrice: ['', [Validators.required, Validators.min(0)]]
    });
  }

  get make() {
    return this.createCarForm.get('make');
  }

  get model() {
    return this.createCarForm.get('model');
  }

  get initialPrice() {
    return this.createCarForm.get('initialPrice');
  }

  createCar() {
    this.showAlert = undefined;
    this.txHash = undefined;

    if (this.createCarForm.invalid) {
      return;
    }

    const price = ethers.utils.parseEther(this.initialPrice.value.toString());
    if (price) {
      this.contractService
        .createCar(this.make.value, this.model.value, price)
        .subscribe(txHash => {
          if (txHash) {
            this.txHash = txHash;
            this.showAlert = true;
          }
        });
    }

    this.createCarForm.reset();
  }

  closeAlert() {
    this.showAlert = false;
  }
}
