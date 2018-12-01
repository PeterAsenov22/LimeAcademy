const etherlime = require('etherlime');
const ethers = require('ethers');
const CarProducer = require('../build/CarProducer.json');
const CarToken = require('../build/CarToken.json');
const CarShop = require('../build/CarShop.json');
const CarTokenCrowdsale = require('../build/CarTokenCrowdsale.json');
const ProposalFactory = require('../build/ProposalFactory.json');
const Voting = require('../build/Voting.json');
const EtherPool = require('../build/EtherPool.json');

describe.only('CarTokenCrowdsale', () => {
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const ONE_ETHER = ethers.utils.bigNumberify('1000000000000000000');
  const TWO_ETHERS = ethers.utils.bigNumberify('2000000000000000000');
  const THREE_ETHERS = ethers.utils.bigNumberify('3000000000000000000');

  const dateNow = Date.now();
  const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
  const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);
  const crowdsaleSoftCap = ethers.utils.bigNumberify('10000000000000000000');
	const crowdsaleHardCap = ethers.utils.bigNumberify('100000000000000000000');

  const tokenName = 'Car Token'
  const tokenSymbol = 'CT'
  const tokenDecimals = 18;

  const owner = accounts[0];
  const firstUser = accounts[1];
  const secondUser = accounts[2];
  const thirdUser = accounts[3];

  let deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
  let provider = deployer.provider;

  let deployedCarTokenWrapper;
  let deployedCarProducerWrapper;
  let deployedCarShopWrapper;
  let deployedCarTokenCrowdsaleWrapper;
  let deployedProposalFactoryWrapper;
  let carTokenContract;
  let carProducerContract;
  let carShopContract;
  let crowdsaleContract;
  let proposalFactoryContract;
  let votingContractAddress;
  let votingContract;
  let etherPoolContractAddress;
  let etherPoolContract;

  describe('initialization', () => {
    it('should deploy CarToken successfully', async () => {
      deployedCarTokenWrapper = await deployer.deploy(CarToken, {}, tokenName, tokenSymbol, tokenDecimals);
      carTokenContract = deployedCarTokenWrapper.contract;

      let name = await carTokenContract.name();
      let symbol = await carTokenContract.symbol();
      let decimals = await carTokenContract.decimals();
      let totalSupply = await carTokenContract.totalSupply();

      assert.strictEqual(name, tokenName, "Token name not set correctly.");
      assert.strictEqual(symbol, tokenSymbol, "Token symbol not set correctly.");
      assert.strictEqual(decimals, tokenDecimals, "Token decimals not set correctly.");
      assert(totalSupply.eq(0), "Invalid total supply.");
    });

    it('should deploy CarProducer successfully', async () => {
      deployedCarProducerWrapper = await deployer.deploy(CarProducer);
      carProducerContract = deployedCarProducerWrapper.contract;

      let contractOwner = await carProducerContract.owner();
      let carShopContractAddress = await carProducerContract.carShopContract();
      let crowdsaleContractAddress = await carProducerContract.crowdsaleContract();
      let votingContractAddress = await carProducerContract.votingContract();     

      assert.strictEqual(contractOwner, owner.wallet.address, "Contract owner not set correctly.");
      assert.strictEqual(carShopContractAddress, zeroAddress, "Invalid CarShop contract address.");
      assert.strictEqual(crowdsaleContractAddress, zeroAddress, "Invalid Crowdsale contract address.");
      assert.strictEqual(votingContractAddress, zeroAddress, "Invalid Voting contract address.");
    });

    it('should deploy ProposalFactory successfully', async () => {
      deployedProposalFactoryWrapper = await deployer.deploy(ProposalFactory, {}, deployedCarTokenWrapper.contractAddress, deployedCarProducerWrapper.contractAddress);
      proposalFactoryContract = deployedProposalFactoryWrapper.contract;

      votingContractAddress = await proposalFactoryContract.votingContract();
      assert.notEqual(votingContractAddress, zeroAddress, "Voting contract address not set correctly.");
    });

    it('should have deployed Voting contract successfully', async () => {
      votingContract = new ethers.Contract(votingContractAddress, Voting.abi, provider);
      
      let tokenContractAddress = await votingContract.tokenContract();
      let carProducerContractAddress = await votingContract.carProducerContract();
      let companyAddress = await votingContract.companyAddress();
      etherPoolContractAddress = await votingContract.etherPoolContract();

      assert.strictEqual(tokenContractAddress, deployedCarTokenWrapper.contractAddress, "CarToken contract address not set correctly.");
      assert.strictEqual(carProducerContractAddress, deployedCarProducerWrapper.contractAddress, "Invalid CarShop contract address.");
      assert.strictEqual(companyAddress, owner.wallet.address, "Invalid company address.");
      assert.notEqual(etherPoolContractAddress, zeroAddress, "EtherPool contract address not set correctly.");
    });

    it('should have deployed EtherPool contract successfully', async () => {
      etherPoolContract = new ethers.Contract(etherPoolContractAddress, EtherPool.abi, provider);

      let poolBalance = await etherPoolContract.getBalance();
      assert(poolBalance.eq(0), "Invalid balance.");
    });

    it('should deploy CarShop successfully', async () => {
      deployedCarShopWrapper = await deployer.deploy(CarShop, {}, deployedCarProducerWrapper.contractAddress);
      carShopContract = deployedCarShopWrapper.contract;

      let producerContract = await carShopContract.producerContract();     

      assert.strictEqual(producerContract, deployedCarProducerWrapper.contractAddress, "CarProducer contract address not set correctly.");
    });

    it('should deploy CarTokenCrowdsale successfully', async () => {    
      deployedCarTokenCrowdsaleWrapper = await deployer.deploy(CarTokenCrowdsale, {}, crowdsaleSoftCap, crowdsaleHardCap, crowdsaleStartDate, crowdsaleEndDate, etherPoolContractAddress, deployedCarTokenWrapper.contractAddress, deployedCarProducerWrapper.contractAddress);
      crowdsaleContract = deployedCarTokenCrowdsaleWrapper.contract;

      let startDate = await crowdsaleContract.openingTime();
      let endDate = await crowdsaleContract.closingTime();
      let firstWeekEnd = await crowdsaleContract.firstWeekPublicSaleEndDate();
      let diffBetweenStartDateAndFirstWeekEnd = firstWeekEnd.toNumber() - crowdsaleStartDate;
      let diffBetweenEndDateAndFirstWeekEnd = crowdsaleEndDate - firstWeekEnd.toNumber();
      let softCap = await crowdsaleContract.goal();
      let hardCap = await crowdsaleContract.cap();
      let wallet = await crowdsaleContract.wallet();
      let token = await crowdsaleContract.token();
      let carProducerAddress = await crowdsaleContract.carProducerAddress();
      let weiRaised = await crowdsaleContract.weiRaised();
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();
      let isGoalReached = await crowdsaleContract.goalReached();
      let isCapReached = await crowdsaleContract.capReached();
      let hasClosed = await crowdsaleContract.hasClosed();
      let finalized = await crowdsaleContract.finalized();

      assert(startDate.eq(crowdsaleStartDate), 'Crowdsale start date was not set correctly');
      assert(endDate.eq(crowdsaleEndDate), 'Crowdsale end date was not set correctly');
      assert.strictEqual(diffBetweenStartDateAndFirstWeekEnd, diffBetweenEndDateAndFirstWeekEnd, 'FirstWeekPublicSaleEndDate was not set correctly');
      assert(softCap.eq(crowdsaleSoftCap), 'Soft Cap was not 10 ethers');
      assert(hardCap.eq(crowdsaleHardCap), 'Hard Cap was not 100 ethers');
      assert.strictEqual(wallet, etherPoolContractAddress, 'Crowdsale wallet was not set correctly');
      assert.strictEqual(token, deployedCarTokenWrapper.contractAddress, 'CarToken address was not set correctly');
      assert.strictEqual(carProducerAddress, deployedCarProducerWrapper.contractAddress, 'CarProducer address was not set correctly');
      assert(weiRaised.eq(0), 'Crowdsale wei raised was not zero');
      assert(!isCrowdsaleOpen, 'Crowdsale was open');
      assert(!isGoalReached, 'Crowdsale goal was reached');
      assert(!isCapReached, 'Crowdsale cap was reached');
      assert(!hasClosed, 'Crowdsale has closed');
      assert(!finalized, 'Crowdsale is finalized');
    });
  });
});