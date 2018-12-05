pragma solidity ^0.4.25;

import "./ECTools.sol";

contract ECVerifier {
  function verify(bytes32 originalData, bytes memory signature) public view returns (address) {
    return ECTools.prefixedRecover(originalData, signature);
  }
}