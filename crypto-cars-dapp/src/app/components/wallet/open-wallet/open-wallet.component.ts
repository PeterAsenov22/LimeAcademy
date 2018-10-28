import { Component, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { FormBuilder, Validators } from '@angular/forms';
import { ProviderService } from 'src/app/core/services/provider.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WalletService } from 'src/app/core/services/wallet.service';

@Component({
  selector: 'app-open-wallet',
  templateUrl: './open-wallet.component.html',
  styleUrls: ['./open-wallet.component.css']
})
export class OpenWalletComponent implements OnInit {
  protected accessType;
  protected file;
  protected passwordForm;
  protected mnemonicForm;
  protected privateKeyForm;
  protected isDecryptingNow: boolean;
  protected progressInPercents: number;

  constructor(
    private providerService: ProviderService,
    private walletService: WalletService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit() {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required]]
    });

    this.mnemonicForm = this.fb.group({
      mnemonic: ['', [Validators.required]]
    });

    this.privateKeyForm = this.fb.group({
      privateKey: ['', [Validators.required]]
    });
  }

  get password () {
    return this.passwordForm.get('password');
  }

  get mnemonic () {
    return this.mnemonicForm.get('mnemonic');
  }

  get privateKey () {
    return this.privateKeyForm.get('privateKey');
  }

  openWalletWithMnemonic() {
    const mnemonic = this.mnemonic.value;
    this.mnemonicForm.reset();

    try {
      const initializedWallet = ethers.Wallet.fromMnemonic(mnemonic);
      const wallet = initializedWallet.connect(this.providerService.getProvider());
      this.walletService.loadWallet(wallet);
      this.router.navigate(['/wallet/info']);
      this.toastr.success('Wallet loaded successfully');
    } catch {
      this.toastr.error('Invalid mnemonic');
    }
  }

  openWalletWithPrivateKey() {
    const privateKey = this.privateKey.value;
    this.mnemonicForm.reset();

    try {
      const wallet = new ethers.Wallet(privateKey, this.providerService.getProvider());
      this.walletService.loadWallet(wallet);
      this.router.navigate(['/wallet/info']);
      this.toastr.success('Wallet loaded successfully');
    } catch {
      this.toastr.error('Invalid mnemonic');
    }
  }

  async openWalletWithJsonFile() {
    const password = this.password.value;
    this.passwordForm.reset();

    try {
      this.isDecryptingNow = true;
      const file = JSON.stringify(this.file);
      const initializedWallet = await ethers.Wallet.fromEncryptedJson(file, password, (progress) => {
        this.progressInPercents = Math.round(progress * 100);
      });

      const wallet = initializedWallet.connect(this.providerService.getProvider());
      this.walletService.loadWallet(wallet);
      this.router.navigate(['/wallet/info']);
      this.toastr.success('Wallet loaded successfully');
    } catch {
      this.toastr.error('Invalid password');
    }

    this.isDecryptingNow = false;
  }

  handleFileInput(files) {
    if (files && files.length > 0) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const json = JSON.parse(fileReader.result.toString());
        this.file = json;
      };

      fileReader.readAsText(files[0]);
    }
  }
}
