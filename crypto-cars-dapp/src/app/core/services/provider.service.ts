import { ethers } from 'ethers';
import { Injectable } from '@angular/core';

const network = 'ropsten';
const apiAccessToken = 'f8d2169f70584df396394ad9ce130289';

@Injectable()
export class ProviderService {
  private infuraProvider: ethers.providers.InfuraProvider;

  constructor() {
    this.infuraProvider = new ethers.providers.InfuraProvider(network, apiAccessToken);
  }

  getProvider(): ethers.providers.InfuraProvider {
    return this.infuraProvider;
  }
}
