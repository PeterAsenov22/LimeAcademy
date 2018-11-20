pragma solidity ^0.4.25;

import "./CarToken.sol";
import "./CarProducer.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract CarTokenCrowdsale is CappedCrowdsale, MintedCrowdsale, RefundableCrowdsale {
  using SafeMath for uint;

  uint public constant CROWDSALE_DURATION = 2 weeks;
  uint public constant DEFAULT_RATE = 100;
  uint public constant PUBLIC_SALE_1_WEEK_RATE = 140;
  uint public constant SOFT_CAP = 10 ether;
  uint public constant HARD_CAP = 100 ether;
  uint public constant MIN_CONTRIBUTION_AMOUNT = 10 finney;
  uint public constant OWNER_PERCENTAGE_TOKENS = 10;

  uint public firstWeekPublicSaleEndDate;
  address public carProducerAddress;

  constructor(uint _startDate, uint _endDate, address _etherPoolAddress, address _tokenAddress, address _carProducerAddress) public
    CappedCrowdsale(HARD_CAP)
    RefundableCrowdsale(SOFT_CAP)
    TimedCrowdsale(_startDate, _endDate)
    Crowdsale(DEFAULT_RATE, _etherPoolAddress, IERC20(_tokenAddress))
    {
      require(SOFT_CAP <= HARD_CAP, "HARD_CAP is not bigger than SOFT_CAP");
      require(_endDate.sub(_startDate) == CROWDSALE_DURATION, "Crowdsale duration is not 2 weeks");

      firstWeekPublicSaleEndDate = _startDate.add(1 weeks);
      carProducerAddress = _carProducerAddress;
    }

  /**
   * @dev Extend parent behavior requiring purchase to respect the minimum contribution amount.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view {
    require(_weiAmount >= MIN_CONTRIBUTION_AMOUNT, "Your have to pay minimum of 10 finney to buy tokens");

    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

   /**
   * @dev Overrided to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns(uint256) {
    if(now <= firstWeekPublicSaleEndDate){        
      return _weiAmount.mul(PUBLIC_SALE_1_WEEK_RATE);
    }

    return _weiAmount.mul(DEFAULT_RATE);
  }

   /**
   * @dev Overrided FinalizableCrowdsale's _finalization function to mint tokens to the contract owner.
   */
  function _finalization() internal {
    if(goalReached()) {
      uint256 ownerTokenAmount = ((IERC20(token()).totalSupply()).mul(OWNER_PERCENTAGE_TOKENS)).div(100);
      ERC20Mintable(address(token())).mint(wallet(), ownerTokenAmount);
      CarProducer(carProducerAddress).generateFirstTenCars();
    }

    super._finalization();
  }
}
