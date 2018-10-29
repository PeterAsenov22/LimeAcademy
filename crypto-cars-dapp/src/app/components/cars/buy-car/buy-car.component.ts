import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { ethers } from 'ethers';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-buy-car',
  templateUrl: './buy-car.component.html',
  styleUrls: ['./buy-car.component.css']
})
export class BuyCarComponent implements OnInit {
  protected car;
  protected carPrice;
  protected buyForm;
  protected notFound;
  protected notFoundMessage = 'Car Not Found';
  protected ethers = ethers;
  private id: number;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private contractService: ContractService) { }

  ngOnInit() {
    this.id = parseInt(this.route.snapshot.paramMap.get('id'), 10);
    if (!isNaN(this.id)) {
      this.contractService
        .getCar(this.id)
        .subscribe(car => {
          if (car) {
            this.buyForm = this.fb.group({
              amount: ['', [Validators.required]]
            });

            this.car = car;
            if (this.car._isSecondHand) {
              this.carPrice = car._carPrice.mul(2);
            } else {
              this.carPrice = car._carPrice;
            }
          } else {
            this.notFound = true;
          }
        });
    } else {
      this.notFound = true;
    }
  }

  get amount() {
    return this.buyForm.get('amount');
  }

  buyCar() {
    if (this.buyForm.invalid) {
      return;
    }

    const amountInEth = ethers.utils.parseEther(this.amount.value.toString());
    if (amountInEth.lt(this.carPrice)) {
      this.buyForm.reset();
      this.toastr.error('Amount to spend should be at least as much as the current price');
    } else {
      this.contractService
        .buyCar(this.id, amountInEth, this.car._isSecondHand)
        .subscribe(txHash => {
          if (txHash) {
            this.router.navigate(['/']);
            this.toastr
              // tslint:disable-next-line:max-line-length
              .success(`See transaction here: <a href="https://ropsten.etherscan.io/tx/${txHash}">https://ropsten.etherscan.io/tx/${txHash}</a>`,
              'Transaction sent successfully!', {
              timeOut: 40000,
              enableHtml: true
              });
          }
        });
    }
  }
}
