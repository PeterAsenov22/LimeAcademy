pragma solidity ^0.4.25;

import "./CarProposal.sol";
import "./Voting.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ProposalFactory is Ownable {
  address public votingContract;
    
  constructor(address _tokenContract, address _carProducerContract) public {
    votingContract = new Voting(_tokenContract, _carProducerContract, owner());
  }

  function addNewCarProposal(bytes32 _carName, bytes32 _carEngine, uint _carPrice, uint _tap, uint _deadline) public onlyOwner {
    address carProposal = new CarProposal(_carName, _carEngine, _carPrice, _tap, _deadline, votingContract);
    Voting(votingContract).addProposal(carProposal);
  }
}
