pragma solidity ^0.4.25;

contract CarProposal {
  /*
  Proposal statuses:
      0 -> Unapproved
      1 -> Rejected
      2 -> Processing
      3 -> Inactive
      4 -> Approved
      
  Proposal development statuses:
      0 -> false
      1 -> true
  */
    
  bytes32 public proposedCarName;
  bytes32 public proposedCarEngine;
  uint public proposedCarPrice;
  uint public tap;
  uint public deadline;
  uint public endTime;
  uint public status = 0;
  uint public developedStatus = 0;
  address public proposalOwner;
  address public votingContract;
    

  modifier onlyProposalOwner() {
    require(msg.sender == proposalOwner, "Only proposal owner can execute this operation");
    _;
  }
    
  modifier onlyVotingContract() {
    require(msg.sender == votingContract, "Only votingContract can execute this operation");
    _;
  }

  modifier onlyValidStatus(uint _status){
    require(_status <= 4, "Status is invalid");
    _;
  }

  constructor(bytes32 _carName, bytes32 _carEngine, uint _carPrice, uint _tap, uint _deadline, address _votingContract) public {
    proposedCarName = _carName;
    proposedCarEngine = _carEngine;
    proposedCarPrice = _carPrice;
    tap = _tap;
    deadline = _deadline;
    votingContract = _votingContract;
    endTime = now + 1 minutes;
    proposalOwner = msg.sender;
  }

  function updateStatus(uint _status) public onlyVotingContract onlyValidStatus(_status) {
    status = _status;
  }
    
  function updateDevelopedStatus() public onlyProposalOwner {
    require(status == 2, "Proposal status is not Processing");
    if(now > deadline) {
      status = 3; // 3 -> status: Inactive
    }
    else {
      developedStatus = 1; // 1 -> developedStatus: True
      endTime = now + 1 minutes;
    }
  }
}
