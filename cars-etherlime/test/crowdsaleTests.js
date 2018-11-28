const etherlime = require('etherlime');
const ethers = require('ethers');
const CarTokenCrowdsale = require('../build/CarTokenCrowdsale.json');
const CarToken = require('../build/CarToken.json');

describe('CarTokenCrowdsale', () => {
  const ONE_ETHER = ethers.utils.bigNumberify('1000000000000000000');
  const TWO_ETHERS = ethers.utils.bigNumberify('2000000000000000000');
  const TEN_ETHERS = ethers.utils.bigNumberify('10000000000000000000');
  const NINETY_ETHERS = ethers.utils.bigNumberify('90000000000000000000');
  const ONE_HUNDRED_ETHERS = ethers.utils.bigNumberify('100000000000000000000');
  const ONE_HUNDRED_TOKENS = ethers.utils.bigNumberify('100000000000000000000');
  const TWO_HUNDRED_TOKENS = ethers.utils.bigNumberify('200000000000000000000');
  const ONE_HUNDRED_AND_FOURTY_TOKENS = ethers.utils.bigNumberify('140000000000000000000');

  const dateNow = Date.now();
  const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
  const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);

  const tokenName = 'Car Token'
  const tokenSymbol = 'CT'
  const tokenDecimals = 18;

  const owner = accounts[0];
  const secondUser = accounts[1];
  const thirdUser = accounts[2];

  let deployer;
  let provider;
  let deployedCarTokenCrowdsaleContractWrapper;
  let crowdsaleContract;
  let tokenContract;
  let _contract;
  let tokensTotalSupply;

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
      let isGoalReached = await crowdsaleContract.goalReached();
      let isCapReached = await crowdsaleContract.capReached();
      let hasClosed = await crowdsaleContract.hasClosed();
      let finalized = await crowdsaleContract.finalized();

      assert(startDate.eq(crowdsaleStartDate), 'Crowdsale start date was not set correctly');
      assert(endDate.eq(crowdsaleEndDate), 'Crowdsale end date was not set correctly');
      assert.strictEqual(diffBetweenStartDateAndFirstWeekEnd, diffBetweenEndDateAndFirstWeekEnd, 'FirstWeekPublicSaleEndDate was not set correctly');
      assert(softCap.eq(TEN_ETHERS), 'Soft Cap was not 10 ethers');
      assert(hardCap.eq(ONE_HUNDRED_ETHERS), 'Hard Cap was not 100 ethers');
      assert.strictEqual(wallet, owner.wallet.address, 'Crowdsale wallet was not set correctly');
      assert(weiRaised.eq(0), 'Crowdsale wei raised was not zero');
      assert(!isCrowdsaleOpen, 'Crowdsale was open');
      assert(!isGoalReached, 'Crowdsale goal was reached');
      assert(!isCapReached, 'Crowdsale cap was reached');
      assert(!hasClosed, 'Crowdsale has closed');
      assert(!finalized, 'Crowdsale is finalized');
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
    it('should open the crowdsale successfully', async () => {
      deployedCarTokenCrowdsaleContractWrapper = await deployer.deploy(CarTokenCrowdsale, {}, crowdsaleStartDate, crowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals);
      crowdsaleContract = deployedCarTokenCrowdsaleContractWrapper.contract;

      await utils.timeTravel(provider, 3*24*3600);
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();

      assert(isCrowdsaleOpen, 'Crowdsale was not open');
    });
  });

  describe('buying tokens in the first period', () => {
    beforeEach(async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
      let tokenAddress = await crowdsaleContract.token();
      tokenContract = new ethers.Contract(tokenAddress, CarToken.abi, _secondUserWallet);
    });

    it('user should buy tokens successfully', async () => {
      await _contract.buyTokens(secondUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});

      let secondUserTokensBalance = await tokenContract.balanceOf(secondUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(secondUserTokensBalance.eq(ONE_HUNDRED_AND_FOURTY_TOKENS), 'User balance was not 140 CT');
      assert(contractWeiRaised.eq(ONE_ETHER), 'Invalid amount of wei raised');
    });

    it('user should be able to buy tokens again', async () => {
      let secondUserPreviousBalance = await tokenContract.balanceOf(secondUser.wallet.address);

      await _contract.buyTokens(secondUser.wallet.address, {value: TWO_ETHERS, gasLimit: 2000000});

      let secondUserTokensBalance = await tokenContract.balanceOf(secondUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(secondUserTokensBalance.eq((ONE_HUNDRED_AND_FOURTY_TOKENS.mul(2)).add(secondUserPreviousBalance)), 'User balance was not 420 CT');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(3)), 'Invalid amount of wei raised');
    });

    it('another user should buy tokens successfully', async () => {
      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider); 
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _thirdUserWallet);

      await _contract.buyTokens(thirdUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});

      let thirdUserTokensBalance = await tokenContract.balanceOf(thirdUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(thirdUserTokensBalance.eq(ONE_HUNDRED_AND_FOURTY_TOKENS), 'User balance was not 140 CT');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(4)), 'Invalid amount of wei raised');
    });

    it('should revert if the user tries to buy tokens with funds less than the minimum contribution amount', async () => {
      await assert.revert(_contract.buyTokens(secondUser.wallet.address, {value: 100000, gasLimit: 2000000}));
    });

    it('should revert if the user tries to claim refund', async () => {
      await assert.revert(_contract.claimRefund(secondUser.wallet.address, {gasLimit: 2000000}));
    });

    it('should revert if the user tries to finalize the crowdsale', async () => {
      await assert.revert(_contract.finalize({gasLimit: 2000000}));
    });
  });

  describe('buying tokens in the second period', () => {
    beforeEach(async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
      let tokenAddress = await crowdsaleContract.token();
      tokenContract = new ethers.Contract(tokenAddress, CarToken.abi, _secondUserWallet);
    });

    it('user should buy tokens successfully', async () => {
      await utils.timeTravel(provider, 7*24*3600);

      let secondUserPreviousBalance = await tokenContract.balanceOf(secondUser.wallet.address);

      await _contract.buyTokens(secondUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});

      let secondUserCurrentBalance = await tokenContract.balanceOf(secondUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(secondUserCurrentBalance.eq((ONE_HUNDRED_TOKENS.add(secondUserPreviousBalance))), 'Invalid user balance');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(5)), 'Invalid amount of wei raised');
    });

    it('user should be able to buy tokens again', async () => {
      let secondUserPreviousBalance = await tokenContract.balanceOf(secondUser.wallet.address);

      await _contract.buyTokens(secondUser.wallet.address, {value: TWO_ETHERS, gasLimit: 2000000});

      let secondUserCurrentBalance = await tokenContract.balanceOf(secondUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(secondUserCurrentBalance.eq(TWO_HUNDRED_TOKENS.add(secondUserPreviousBalance)), 'Invalid user balance');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(7)), 'Invalid amount of wei raised');
    });

    it('user should buy tokens successfully', async () => {
      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider);
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _thirdUserWallet);

      let thirdUserPreviousBalance = await tokenContract.balanceOf(thirdUser.wallet.address);

      await _contract.buyTokens(thirdUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});

      let thirdUserCurrentBalance = await tokenContract.balanceOf(thirdUser.wallet.address);
      let contractWeiRaised = await _contract.weiRaised();

      assert(thirdUserCurrentBalance.eq((ONE_HUNDRED_TOKENS.add(thirdUserPreviousBalance))), 'Invalid user balance');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(8)), 'Invalid amount of wei raised');
    });

    it('should revert if the user tries to buy tokens with funds less than the minimum contribution amount', async () => {
      await assert.revert(_contract.buyTokens(secondUser.wallet.address, {value: 100000, gasLimit: 2000000}));
    });

    it('should revert if the user tries to claim refund', async () => {
      await assert.revert(_contract.claimRefund(secondUser.wallet.address, {gasLimit: 2000000}));
    });

    it('should revert if the user tries to finalize the crowdsale', async () => {
      await assert.revert(_contract.finalize({gasLimit: 2000000}));
    });
  });

  describe('softCap and hardCap', () => {
    beforeEach(async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
    });

    it('should reach the soft cap', async () => {
      let isSoftCapReachedBeforeTheBuy = await _contract.goalReached();

      await _contract.buyTokens(secondUser.wallet.address, {value: TWO_ETHERS, gasLimit: 2000000});

      let contractWeiRaised = await _contract.weiRaised();
      let isSoftCapReached = await _contract.goalReached();

      assert(!isSoftCapReachedBeforeTheBuy, 'Crowdsale soft cap was reached before the last buy');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(10)), 'Invalid amount of wei raised');
      assert(isSoftCapReached, 'Crowdsale soft cap was not reached');
    });

    it('should reach the hard cap', async () => {
      let isHardCapReachedBeforeTheBuy = await _contract.capReached();

      await _contract.buyTokens(secondUser.wallet.address, {value: NINETY_ETHERS, gasLimit: 2000000});

      let contractWeiRaised = await _contract.weiRaised();
      let isHardCapReached = await _contract.capReached();

      assert(!isHardCapReachedBeforeTheBuy, 'Crowdsale hard cap was reached before the last buy');
      assert(contractWeiRaised.eq(ONE_ETHER.mul(100)), 'Invalid amount of wei raised');
      assert(isHardCapReached, 'Crowdsale hard cap was not reached');
    });
  });

  describe('close crowdsale', () => {
    beforeEach(async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
    });

    it('should close the crowdsale successfully', async () => {
      await utils.timeTravel(provider, 7*24*3600);

      let isOpen = await _contract.isOpen();
      let hasClosed = await _contract.hasClosed();
      let finalized = await _contract.finalized();
      tokensTotalSupply = await tokenContract.totalSupply();

      assert(!isOpen, 'Crowdsale was open');
      assert(hasClosed, 'Crowdsale was not closed');
      assert(!finalized, 'Crowdsale was finalized');
    });

    it('should finalize the crowdsale successfully', async () => {
      let walletBalanceBeforeFinalize = await provider.getBalance(owner.wallet.address);

      await _contract.finalize({gasLimit: 2000000});

      let finalized = await _contract.finalized();
      let weiRaised = await _contract.weiRaised();
      let walletBalanceAfterFinalize = await provider.getBalance(owner.wallet.address);

      assert(finalized, 'Crowdsale was not finalized');
      assert(walletBalanceAfterFinalize.eq(walletBalanceBeforeFinalize.add(weiRaised)), 'Crowdsale wallet has invalid balance');
    });

    it('should mint correct amount of tokens to the wallet address', async () => {
      let expectedWalletTokenBalance = tokensTotalSupply.mul(10).div(100);
      
      let walletTokenBalance = await tokenContract.balanceOf(owner.wallet.address);

      assert(walletTokenBalance.eq(expectedWalletTokenBalance), 'Crowdsale wallet has invalid token balance');
    });
  });

  describe('not completed crowdsale', () => {
    let newCrowdsaleStartDate = parseInt((new Date(dateNow + 18 * 24*3600*1000).getTime())/1000);
    let newCrowdsaleEndDate = parseInt((new Date((newCrowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);
    
    it('should deploy the crowdsale successfully', async () => {
      deployedCarTokenCrowdsaleContractWrapper = await deployer.deploy(CarTokenCrowdsale, {}, newCrowdsaleStartDate, newCrowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals);
      crowdsaleContract = deployedCarTokenCrowdsaleContractWrapper.contract;

      let startDate = await crowdsaleContract.openingTime();
      let endDate = await crowdsaleContract.closingTime();
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();

      assert(startDate.eq(newCrowdsaleStartDate), 'Crowdsale start date was not set correctly');
      assert(endDate.eq(newCrowdsaleEndDate), 'Crowdsale end date was not set correctly');
      assert(!isCrowdsaleOpen, 'Crowdsale was open');
    });
  
    it('should open the crowdsale successfully', async () => {
      deployedCarTokenCrowdsaleContractWrapper = await deployer.deploy(CarTokenCrowdsale, {}, newCrowdsaleStartDate, newCrowdsaleEndDate, owner.wallet.address, tokenName, tokenSymbol, tokenDecimals);
      crowdsaleContract = deployedCarTokenCrowdsaleContractWrapper.contract;

      await utils.timeTravel(provider, 3*24*3600);
      let isCrowdsaleOpen = await crowdsaleContract.isOpen();

      assert(isCrowdsaleOpen, 'Crowdsale was not open');
    });

    describe('buying tokens', () => {
      beforeEach(async () => {
        let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
        _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
        let tokenAddress = await crowdsaleContract.token();
        tokenContract = new ethers.Contract(tokenAddress, CarToken.abi, _secondUserWallet);
      });
  
      it('user should buy tokens successfully in the first period', async () => {
        await _contract.buyTokens(secondUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});
  
        let secondUserTokensBalance = await tokenContract.balanceOf(secondUser.wallet.address);
        let contractWeiRaised = await _contract.weiRaised();
  
        assert(secondUserTokensBalance.eq(ONE_HUNDRED_AND_FOURTY_TOKENS), 'User balance was not 140 CT');
        assert(contractWeiRaised.eq(ONE_ETHER), 'Invalid amount of wei raised');
      });

      it('user should buy tokens successfully in the second period', async () => {
        await utils.timeTravel(provider, 7*24*3600);
  
        let secondUserPreviousBalance = await tokenContract.balanceOf(secondUser.wallet.address);
  
        await _contract.buyTokens(secondUser.wallet.address, {value: ONE_ETHER, gasLimit: 2000000});
  
        let secondUserCurrentBalance = await tokenContract.balanceOf(secondUser.wallet.address);
        let contractWeiRaised = await _contract.weiRaised();
  
        assert(secondUserCurrentBalance.eq((ONE_HUNDRED_TOKENS.add(secondUserPreviousBalance))), 'Invalid user balance');
        assert(contractWeiRaised.eq(ONE_ETHER.mul(2)), 'Invalid amount of wei raised');
      });

      it('should have not reached the soft cap', async () => {
        let contractWeiRaised = await crowdsaleContract.weiRaised();
        let isSoftCapReached = await crowdsaleContract.goalReached();
  
        assert(contractWeiRaised.eq(ONE_ETHER.mul(2)), 'Invalid amount of wei raised');
        assert(!isSoftCapReached, 'Crowdsale soft cap was reached');
      });
    });

    describe('close crowdsale', () => {
      beforeEach(async () => {
        let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
        _contract = new ethers.Contract(deployedCarTokenCrowdsaleContractWrapper.contractAddress, CarTokenCrowdsale.abi, _secondUserWallet);
      });

      it('should close the crowdsale successfully', async () => {
        await utils.timeTravel(provider, 7*24*3600);
  
        let isOpen = await crowdsaleContract.isOpen();
        let hasClosed = await crowdsaleContract.hasClosed();
        let finalized = await crowdsaleContract.finalized();
        let isSoftCapReached = await crowdsaleContract.goalReached();
  
        assert(!isOpen, 'Crowdsale was open');
        assert(hasClosed, 'Crowdsale was not closed');
        assert(!finalized, 'Crowdsale was finalized');
        assert(!isSoftCapReached, 'Crowdsale soft cap was reached');
      });
  
      it('should finalize the crowdsale successfully', async () => {
        let walletBalanceBeforeFinalize = await provider.getBalance(owner.wallet.address);
  
        await _contract.finalize({gasLimit: 2000000});
  
        let finalized = await crowdsaleContract.finalized();
        let walletBalanceAfterFinalize = await provider.getBalance(owner.wallet.address);
  
        assert(finalized, 'Crowdsale was not finalized');
        assert(walletBalanceAfterFinalize.eq(walletBalanceBeforeFinalize), 'Crowdsale wallet has invalid balance');
      });
  
      it('should successfully refund the user', async () => {
        let userBalanceBeforeRefund = await provider.getBalance(secondUser.wallet.address);
        await crowdsaleContract.claimRefund(secondUser.wallet.address, {gasLimit: 2000000});

        let userBalanceAfterRefund = await provider.getBalance(secondUser.wallet.address);

        assert((userBalanceBeforeRefund.add(TWO_ETHERS)).eq(userBalanceAfterRefund), 'Crowdsale wallet has invalid token balance');
      });
    });
  });
});