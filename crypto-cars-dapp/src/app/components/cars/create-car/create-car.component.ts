import { Buffer } from 'buffer';
import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ethers } from 'ethers';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-car',
  templateUrl: './create-car.component.html'
})
export class CreateCarComponent implements OnInit {
  protected createCarForm;
  protected showAlert;
  protected txHash;
  private imageBuffer: Buffer;

  constructor(
    private contractService: ContractService,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

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
      this.toastr.error('Invalid form data. Please fill all of the fields and select car image before creating a new car');
      return;
    }

    if (!this.imageBuffer) {
      this.toastr.warning('Please select a car image before creating a new car');
      return;
    }

    const price = ethers.utils.parseEther(this.initialPrice.value.toString());
    if (price) {
      this.contractService
        .createCar(this.make.value, this.model.value, price, this.imageBuffer)
        .subscribe(txHash => {
          if (txHash) {
            this.txHash = txHash;
            this.showAlert = true;
          }
        });
    }

    this.createCarForm.reset();
  }

  handleFileInput(input) {
    if (input.files && input.files.length > 0) {
      const fileReader = new FileReader();
      let result: any;

      fileReader.onloadend = () => {
        result = fileReader.result;
        this.imageBuffer = Buffer.from(result);
      };

      fileReader.readAsArrayBuffer(input.files[0]);
    }
  }

  closeAlert() {
    this.showAlert = false;
  }
}
