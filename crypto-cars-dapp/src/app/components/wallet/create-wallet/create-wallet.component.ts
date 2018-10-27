import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ethers } from 'ethers';

@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styleUrls: ['./create-wallet.component.css']
})
export class CreateWalletComponent implements OnInit {
  protected createWalletForm;
  protected isGeneratingNow: boolean;
  protected isReady: boolean;
  protected showAlert: boolean;
  protected progressInPercents: number;
  protected generatedMnemonic: string;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.createWalletForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(25)]]
    });
  }

  get password () {
    return this.createWalletForm.get('password');
  }

  async createWallet() {
    this.isReady = false;

    if (this.createWalletForm.invalid) {
      return;
    }

    const password = this.password.value;
    this.createWalletForm.reset();

    this.isGeneratingNow = true;
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic;
    const encryptedWallet = await wallet.encrypt(password, (progress) => {
      this.progressInPercents = Math.round(progress * 100);
    });

    this.isReady = true;
    this.showAlert = true;
    this.generatedMnemonic = mnemonic;
    this.isGeneratingNow = false;
    this.progressInPercents = undefined;
    window.localStorage.setItem('encryptedWallet', encryptedWallet);
  }

  downloadJSONFile() {
    const json = window.localStorage.getItem('encryptedWallet');
    if (json) {
      const downloader = document.createElement('a');
      document.body.appendChild(downloader);

      const data = JSON.stringify(json);
      const blob = new Blob([data], { type: 'text/json' });
      const url = window.URL;
      const fileUrl = url.createObjectURL(blob);

      downloader.setAttribute('href', fileUrl);
      const date = new Date();
      downloader.setAttribute('download', `UTC--${date.toISOString()}--wallet-backup`);
      downloader.click();
    }
  }

  closeAlert() {
    this.showAlert = false;
    this.generatedMnemonic = undefined;
  }
}
