import bs58 from 'bs58'
import { Buffer } from 'buffer'

// Return bytes32 hex string from base58 encoded ipfs hash,
// stripping leading 2 bytes from 34 byte IPFS hash
// Assume IPFS defaults: function:0x12=sha2, size:0x20=256 bits
export function getBytes32FromIpfsHash(ipfsHash) {
  return (
    '0x' +
    bs58
      .decode(ipfsHash)
      .slice(2)
      .toString('hex')
  )
}

// Return base58 encoded ipfs hash from bytes32 hex string
// Add our default ipfs values for first 2 bytes:
// function:0x12=sha2, size:0x20=256 bits
// and cut off leading "0x"
export function getIpfsHashFromBytes32(bytes32Hex) {
  const hashHex = '1220' + bytes32Hex.slice(2);
  const hashBytes = Buffer.from(hashHex, 'hex');
  const hashStr = bs58.encode(hashBytes);
  return hashStr;
}