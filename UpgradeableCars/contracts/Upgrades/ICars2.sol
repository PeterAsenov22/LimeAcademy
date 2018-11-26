pragma solidity ^0.4.25;

import "../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";

contract ICars2 is IOwnableUpgradeableImplementation {
    
  /**
   * events
   */
   
  event CarAddedByContractOwner(uint _carIndex, bytes32 _make, bytes32 _model, uint _initialPrice);
  event CarBoughtFromContractOwner(address _buyer, uint256 _price, bytes32 _make, bytes32 _model);
  event CarBoughtFromSeller(address _buyer, address _from, uint _price, bytes32 _make, bytes32 _model);
  event ProfitWithdrawal(uint _amount, uint _timestamp);
    
  /**
   * functions
   */
   
  function addCar(bytes32 _make, bytes32 _model, uint _initialPrice, bytes32 _imageHash) public;
  
  function buyCarFromContractOwner(uint _index, uint _tokens) public;

  function buyCarFromSeller(uint _index, uint _tokens) public;
  
  function setCarTokenContractAddress(address _carTokenContract) public;

  function setOracleContractAddress(address _oracleContract) public;

  function getCarTokenContractAddress() public view returns (address _carTokenContract);
  
  function getOracleContractAddress() public view returns (address _oracleContract);
  
  function getCarInfo(uint _index) public view returns (bytes32 _carMake, bytes32 _carModel, address _carOwner, uint _carPrice, bool _isSecondHand, bytes32 _imageHash);
  
  function getCarPriceInUSD(uint _index) public view returns (uint _carPriceInUSD);
  
  function getAddressCars(address _address) public view returns (uint[]);
  
  function getTotalSpendingsByAddress(address _address) public view returns (uint);
  
  function getCarsCount() public view returns (uint);
  
  function withdrawProfit() public;
  
  function removeCarFromCurrentOwner(address _owner, uint _carIndex) private;
}
