const etherlime = require('etherlime');
const CarTokenCrowdsale = require('../build/CarTokenCrowdsale.json');

describe('CarTokenCrowdsale', () => {
  const TEN_ETHERS = ethers.utils.bigNumberify('10000000000000000000');
  const ONE_HUNDRED_ETHERS = ethers.utils.bigNumberify('100000000000000000000');

  const dateNow = Date.now();
  const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
  const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);

  const tokenName = 'Car Token'
  const tokenSymbol = 'CT'
  const tokenDecimals = 18;

  const owner = accounts[0];

  let deployer;
  let provider;
  let deployedCarTokenCrowdsaleContractWrapper;
  let crowdsaleContract;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    provider = deployer.provider;
  });

  describe('initialization', () => {
    it('should initialize contract with correct values', async () => {
      deployedCarTokenCrowdsaleContractWrapper = await deployer.deploy(CarTokenCrowdsale, {}, crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals);
      crowdsaleContract = deployedCarTokenCrowdsaleContractWrapper.contract;

      let startDate = await crowdsaleContract.openingTime();
      let endDate = await crowdsaleContract.closingTime();
      let firstWeekEnd = await crowdsaleContract.firstWeekPublicSaleEndDate();

      let diffBetweenStartDateAndFirstWeekEnd = firstWeekEnd.toNumber() - crowdsaleStartDate;
      let diffBetweenEndDateAndFirstWeekEnd = crowdsaleEndDate - firstWeekEnd.toNumber();
      let softCap = await crowdsaleContract.goal();
      let hardCap = await crowdsaleContract.cap();
      let wallet = await crowdsaleContract.wallet();
      let weiRaised = await crowdsaleContract.weiRaised();
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();

      assert(startDate.eq(crowdsaleStartDate), 'Crowdsale start date was not set correctly');
      assert(endDate.eq(crowdsaleEndDate), 'Crowdsale end date was not set correctly');
      assert.strictEqual(diffBetweenStartDateAndFirstWeekEnd, diffBetweenEndDateAndFirstWeekEnd, 'FirstWeekPublicSaleEndDate was not set correctly');
      assert(softCap.eq(TEN_ETHERS), 'Soft Cap was not 10 ethers');
      assert(hardCap.eq(ONE_HUNDRED_ETHERS), 'Hard Cap was not 100 ethers');
      assert.strictEqual(wallet, owner.wallet.address, 'Crowdsale wallet was not set correctly');
      assert(weiRaised.eq(0), 'Crowdsale wei raised was not zero');
      assert(!isCrowdsaleOpen, 'Crowdsale was open');
    });

    it('should revert if crowdsale duration is less than 2 weeks ', async () => {
      const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
      const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 7 * 24*3600*1000).getTime())/1000);

      await assert.revert(deployer.deploy(CarTokenCrowdsale, {},crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals));
    });

    it('should revert if crowdsale duration is more than 2 weeks ', async () => {
      const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
      const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 21 * 24*3600*1000).getTime())/1000);

      await assert.revert(deployer.deploy(CarTokenCrowdsale, {},crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals));
    });

    it('should revert if start date is before block.timestamp', async () => {
      const crowdsaleStartDate = parseInt((new Date(dateNow - 2 * 24*3600*1000).getTime())/1000);
      const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);

      await assert.revert(deployer.deploy(CarTokenCrowdsale, {},crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals));
    });
  });

  describe('open crowdsale', () => {
    beforeEach(async () => {
      deployedCarTokenCrowdsaleContractWrapper = await deployer.deploy(CarTokenCrowdsale, {}, crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals);
      crowdsaleContract = deployedCarTokenCrowdsaleContractWrapper.contract;
    });

    it('should open the crowdsale successfully', async () => {
      await utils.timeTravel(provider, 3*24*3600);
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();

      assert(isCrowdsaleOpen, 'Crowdsale was not open');
    });
  });
});