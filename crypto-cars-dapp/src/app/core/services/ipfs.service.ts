import * as IPFS from 'ipfs-api';
import { Buffer } from 'buffer';
import { Injectable } from '@angular/core';

@Injectable()
export class IpfsService {
  private ipfs;

  constructor() {
    this.ipfs = IPFS({
      host: 'ipfs.infura.io',
      port: '5001',
      protocol: 'https'
    });
  }

  addFile(buffer: Buffer) {
    return this.ipfs.files.add(buffer);
  }
}
