const etherlime = require('etherlime');
const ethers = require('ethers');
const Cars = require('../build/Cars.json');
const Cars2 = require('../build/Cars2.json');
const ICars = require('../build/ICars.json');
const ICars2 = require('../build/ICars2.json');
const CarsProxy = require('../build/CarsProxy.json');
const CarToken = require('../build/CarToken.json');
const Oracle = require('../build/Oracle.json');

describe('UpgradeableCars', () => {
  const ONE_CAR_TOKEN = ethers.utils.bigNumberify('1000000000000000000');
  const ONE_AND_A_HALF_CAR_TOKENS = ethers.utils.bigNumberify('1500000000000000000');
  const TWO_CAR_TOKENS = ethers.utils.bigNumberify('2000000000000000000');
  const FOUR_CAR_TOKENS = ethers.utils.bigNumberify('4000000000000000000');
  const EIGHT_CAR_TOKENS = ethers.utils.bigNumberify('8000000000000000000');
  const TEN_CAR_TOKENS = ethers.utils.bigNumberify('10000000000000000000');
  const TEN_AND_A_HALF_CAR_TOKENS = ethers.utils.bigNumberify('10500000000000000000');

  const owner = accounts[0];
  const secondUser = accounts[1];
  const thirdUser = accounts[2];

  const ethPrice = 140;
  const tokenName = 'Car Token';
	const tokenSymbol = 'CT'
  const tokenDecimals = 18;

  const make = ethers.utils.formatBytes32String('Audi');
  const model = ethers.utils.formatBytes32String('A6');
  const initialPrice = ONE_CAR_TOKEN;
  const imageHash = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';

  const defaultOverrideOptions = {
    gasLimit: 2000000
  };

  let deployer;
  let provider;
  let tokenContractWrapper;
  let oracleContractWrapper;
  let carsContractWrapper;
  let proxyWrapper;
  let upgradeableCarsWrapper;
  let upgradeableCarsContract;
  let tokenContract;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    provider = deployer.provider;

    carsContractWrapper = await deployer.deploy(Cars);
    proxyWrapper = await deployer.deploy(CarsProxy, {}, carsContractWrapper.contractAddress);
    tokenContractWrapper = await deployer.deploy(CarToken, {}, tokenName, tokenSymbol, tokenDecimals);
    tokenContract = tokenContractWrapper.contract;

	  upgradeableCarsWrapper = deployer.wrapDeployedContract(ICars, proxyWrapper.contractAddress);
    upgradeableCarsContract = upgradeableCarsWrapper.contract;
    await upgradeableCarsContract.init(defaultOverrideOptions);
    await upgradeableCarsContract.setCarTokenContractAddress(tokenContractWrapper.contractAddress, defaultOverrideOptions);
  });

  describe('initialization', () => {
    it('should have set correct contract owner', async () => {   
      let contractOwner = await upgradeableCarsContract.getOwner();
      
      assert.strictEqual(contractOwner, owner.wallet.address, 'Invalid contract owner');
    });

    it('should have set correct token contract address', async () => {    
      let tokenContractAddress = await upgradeableCarsContract.getCarTokenContractAddress();
      let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract.address);
      
      assert.strictEqual(tokenContractAddress, tokenContractWrapper.contractAddress, 'Invalid token contract address');
      assert(contractTokenBalance.eq(0), 'Invalid contract token balance');
    });
  });

  describe('addCar', () => {
    it('should add car successfully', async () => {
      let tx = await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, upgradeableCarsContract, 'CarAddedByContractOwner');
      assert(isEmitted, 'Event CarAddedByContractOwner was not emitted');

      let logs = utils.parseLogs(txReceipt, upgradeableCarsContract, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');

      assert(logs[0]._carIndex.eq(0), 'Car index was not set correctly');
      assert.strictEqual(logs[0]._make, make, 'Car make was not set correctly');
      assert.strictEqual(logs[0]._model, model, 'Car model was not set correctly');
      assert(logs[0]._initialPrice.eq(ONE_CAR_TOKEN), 'Car price was not set correctly');
    });
  });

  describe('getCarInfo', () => {
    it('should return correct data', async () => {
      await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      let info  = await upgradeableCarsContract.getCarInfo(0);
      
      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(initialPrice), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, owner.wallet.address, 'Does not return correct value for car owner');
      assert(!info._isSecondHand, 'Does not return false for isSecondHand');
      assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
    });
  });

  describe('buyCarFromContractOwner', async () => {
    let _upgradeableCarsContract;
    let _tokenContract;

    beforeEach(async () => {
      await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);

      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _upgradeableCarsContract = new ethers.Contract(upgradeableCarsContract.address, Cars.abi, _secondUserWallet);
      
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(upgradeableCarsContract.address, TWO_CAR_TOKENS);
    });

    it('should transfer car to the buyer successfully', async () => {
      let tx = await _upgradeableCarsContract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, _upgradeableCarsContract, 'CarBoughtFromContractOwner');
      assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted');

      let logs = utils.parseLogs(txReceipt, _upgradeableCarsContract, 'CarBoughtFromContractOwner');   
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
      assert.strictEqual(logs[0]._buyer, secondUser.wallet.address, 'Car ownership was not transfered successfully');
      assert(logs[0]._price.eq(TWO_CAR_TOKENS), 'Car price was not updated successfully');
      assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
      assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
    });

    it('should return correct values after transfer of ownership', async () => {
      await _upgradeableCarsContract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);

      let info  = await _upgradeableCarsContract.getCarInfo(0);   
      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(TWO_CAR_TOKENS), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, secondUser.wallet.address, 'Does not return correct value for car owner');
      assert(info._isSecondHand, 'Does not return true for isSecondHand');
      assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
    });

    it('should transfer correct amount of tokens to the contract owner', async () => {
      await _upgradeableCarsContract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);
      let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract.address);

      assert(contractTokenBalance.eq(TWO_CAR_TOKENS), 'Invalid contract token balance');
    });
  });

  describe('buyCarFromSeller', () => {
    let _upgradeableCarsContract;
    let _tokenContract;

    beforeEach(async () => {
      await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await tokenContract.mint(thirdUser.wallet.address, TEN_CAR_TOKENS);

      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _upgradeableCarsContract = new ethers.Contract(upgradeableCarsContract.address, Cars.abi, _secondUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(upgradeableCarsContract.address, ONE_CAR_TOKEN);
      await _upgradeableCarsContract.buyCarFromContractOwner(0, initialPrice, defaultOverrideOptions);

      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider);
      _upgradeableCarsContract = new ethers.Contract(upgradeableCarsContract.address, Cars.abi, _thirdUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _thirdUserWallet);
      await _tokenContract.approve(upgradeableCarsContract.address, TEN_CAR_TOKENS);
    });

    describe('buyCarFromSeller function', () => {
      it('should transfer car from seller to buyer successfully', async () => {
        let tx = await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);

        let isEmitted = utils.hasEvent(txReceipt, _upgradeableCarsContract, 'CarBoughtFromSeller');
        assert(isEmitted, 'Event CarBoughtFromSeller was not emitted');

        let logs = utils.parseLogs(txReceipt, _upgradeableCarsContract, 'CarBoughtFromSeller');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, thirdUser.wallet.address, 'Car ownership was not transfered successfully');
        assert.strictEqual(logs[0]._from, secondUser.wallet.address, 'Previous owner of the car was not valid');
        assert(logs[0]._price.eq(TWO_CAR_TOKENS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should revert if car does not exist', async () => {
        await assert.revert(_upgradeableCarsContract.buyCarFromSeller(1, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if ether sent is not at least twice the price of the car', async () => {
        await assert.revert(_upgradeableCarsContract.buyCarFromSeller(0, ONE_CAR_TOKEN, defaultOverrideOptions));
      });

      it('should revert if you try to buy not second-hand car', async () => {
        await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
        await assert.revert(_upgradeableCarsContract.buyCarFromSeller(1, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if owner of the car tries to call it', async () => {
        await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);
        await assert.revert(_upgradeableCarsContract.buyCarFromSeller(0, FOUR_CAR_TOKENS, defaultOverrideOptions));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let info  = await _upgradeableCarsContract.getCarInfo(0);    
        assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
        assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
        assert(info._carPrice.eq(TWO_CAR_TOKENS), 'Does not return correct value for car price');
        assert.strictEqual(info._carOwner, thirdUser.wallet.address, 'Does not return correct value for car owner');
        assert(info._isSecondHand, 'Does not return true for isSecondHand');
        assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
      });
    });

    describe('getAddressCars function', () => {
      it('should return correct indexes after transfer of ownership', async () => {
        await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let secondUserCars = await _upgradeableCarsContract.getAddressCars(secondUser.wallet.address);
        let thirdUserCars = await _upgradeableCarsContract.getAddressCars(thirdUser.wallet.address);

        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(0), 'Car has not been removed from secondUserCars');
        assert(ethers.utils.bigNumberify(thirdUserCars.length).eq(1), 'Car has not been added to thirdUserCars');
        assert(thirdUserCars[0].eq(0), 'Does not return correct car index');
      });
    });

    describe('token balances', () => {
      it('should return correct token balances', async () => {
        await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract.address);
        let secondUserTokenBalance = await tokenContract.balanceOf(secondUser.wallet.address);
        let thirdUserTokenBalance = await tokenContract.balanceOf(thirdUser.wallet.address);

        assert(contractTokenBalance.eq(ONE_AND_A_HALF_CAR_TOKENS));
        assert(secondUserTokenBalance.eq(TEN_AND_A_HALF_CAR_TOKENS));
        assert(thirdUserTokenBalance.eq(EIGHT_CAR_TOKENS));
      });
    });

    describe('getTotalSpendingsByAddress function', () => {
      it('should return correct amount of tokens spent by address', async () => {
        await _upgradeableCarsContract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let secondUserSpendings = await upgradeableCarsContract.getTotalSpendingsByAddress(secondUser.wallet.address);
        let thirdUserSpendings = await upgradeableCarsContract.getTotalSpendingsByAddress(thirdUser.wallet.address);

        assert(secondUserSpendings.eq(ONE_CAR_TOKEN), 'Incorrect amount of tokens spent by second user');
        assert(thirdUserSpendings.eq(TWO_CAR_TOKENS), 'Incorrect amount of tokens spent by third user');
      });
    });
  });

  describe('withdrawProfit', async () => {
    let _upgradeableCarsContract;
    let _tokenContract;

    beforeEach(async () => {
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _upgradeableCarsContract = new ethers.Contract(upgradeableCarsContract.address, Cars.abi, _secondUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(upgradeableCarsContract.address, TWO_CAR_TOKENS);
      await _upgradeableCarsContract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);
    });

    describe('withdrawProfit function', () => {
      it('should withdraw tokens successfully', async () => {
        let tx = await upgradeableCarsContract.withdrawProfit(defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
        let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract.address);
        let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);

        assert(contractTokenBalance.eq(0));
        assert(ownerTokenBalance.eq(TWO_CAR_TOKENS));
  
        let isEmitted = utils.hasEvent(txReceipt, upgradeableCarsContract, 'ProfitWithdrawal');
        assert(isEmitted, 'Event ProfitWithdrawal was not emitted');
  
        let logs = utils.parseLogs(txReceipt, upgradeableCarsContract, 'ProfitWithdrawal');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert(logs[0]._amount.eq(TWO_CAR_TOKENS), 'Invalid amount of tokens withdrawn');
      });

      it('should revert if non-authorized user tries to call it', async () => {
        await assert.revert(_upgradeableCarsContract.withdrawProfit(defaultOverrideOptions));
      });

      it('should revert if contract balance is zero', async () => {
        await upgradeableCarsContract.withdrawProfit(defaultOverrideOptions);
        await assert.revert(upgradeableCarsContract.withdrawProfit(defaultOverrideOptions));
      });
    });

    describe('token balances', () => {
      it('should return correct token balances', async () => {
       await upgradeableCarsContract.withdrawProfit(defaultOverrideOptions);

       let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract.address);
       let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);
       
       assert(contractTokenBalance.eq(0));
       assert(ownerTokenBalance.eq(TWO_CAR_TOKENS));
      });
    });
  });

  describe('upgrading', () => {
    let _upgradeableCarsContract;
    let upgradedCarsContractWrapper;
    let upgradeableCarsWrapper2;
    let upgradeableCarsContract2;
    let _upgradeableCarsContract2;

    beforeEach(async () => {
      await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, {gasLimit: 2000000});

      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _upgradeableCarsContract = new ethers.Contract(upgradeableCarsContract.address, Cars.abi, _secondUserWallet);

      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await tokenContract.mint(thirdUser.wallet.address, TEN_CAR_TOKENS);

      let _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(upgradeableCarsContract.address, TWO_CAR_TOKENS);

      await _upgradeableCarsContract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, {gasLimit: 2000000});

      upgradedCarsContractWrapper = await deployer.deploy(Cars2);
	    await upgradeableCarsContract.upgradeImplementation(upgradedCarsContractWrapper.contractAddress, {gasLimit: 2000000});
	    upgradeableCarsWrapper2 = deployer.wrapDeployedContract(ICars2, proxyWrapper.contractAddress);
	    upgradeableCarsContract2 = upgradeableCarsWrapper2.contract;

	    oracleContractWrapper = await deployer.deploy(Oracle, {}, ethPrice);     
      await upgradeableCarsContract2.setOracleContractAddress(oracleContractWrapper.contractAddress, {gasLimit: 2000000});

      _upgradeableCarsContract2 = new ethers.Contract(upgradeableCarsContract2.address, Cars2.abi, _secondUserWallet);
      await _tokenContract.approve(upgradeableCarsContract2.address, TWO_CAR_TOKENS);
    });

    it('should have stored correct contract owner', async () => {   
      let contractOwner = await upgradeableCarsContract2.getOwner();
      
      assert.strictEqual(contractOwner, owner.wallet.address, 'Invalid contract owner');
    });

    it('should have set correct oracle contract address', async () => {    
      let oracleContractAddress = await upgradeableCarsContract2.getOracleContractAddress();
      
      assert.strictEqual(oracleContractAddress, oracleContractWrapper.contractAddress, 'Invalid oracle contract address');
    });

    it('should have stored car info', async () => {   
      let info  = await upgradeableCarsContract2.getCarInfo(0);

      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(TWO_CAR_TOKENS), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, secondUser.wallet.address, 'Does not return correct value for car owner');
      assert(info._isSecondHand, 'Does not return true for isSecondHand');
      assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
    });

    it('should return correct price in USD', async () => {
      let ethPriceInUSD = await oracleContractWrapper.contract.ethPriceInUSD();
      let priceInUSD = await upgradeableCarsContract2.getCarPriceInUSD(0);
      
      assert(priceInUSD.eq(TWO_CAR_TOKENS.mul(ethPriceInUSD)), 'Invalid oracle contract address');
    });

    it('should add car successfully', async () => {
      let tx = await upgradeableCarsContract2.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, upgradeableCarsContract2, 'CarAddedByContractOwner');
      assert(isEmitted, 'Event CarAddedByContractOwner was not emitted');

      let logs = utils.parseLogs(txReceipt, upgradeableCarsContract2, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');

      assert(logs[0]._carIndex.eq(1), 'Car index was not set correctly');
      assert.strictEqual(logs[0]._make, make, 'Car make was not set correctly');
      assert.strictEqual(logs[0]._model, model, 'Car model was not set correctly');
      assert(logs[0]._initialPrice.eq(ONE_CAR_TOKEN), 'Car price was not set correctly');
    });

    it('should buy car from contract owner successfully', async () => {
      await upgradeableCarsContract2.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      await _upgradeableCarsContract2.buyCarFromContractOwner(1, TWO_CAR_TOKENS, {gasLimit: 3000000});

      let info  = await _upgradeableCarsContract2.getCarInfo(1);   
      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(TWO_CAR_TOKENS), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, secondUser.wallet.address, 'Does not return correct value for car owner');
      assert(info._isSecondHand, 'Does not return true for isSecondHand');
      assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
    });

    it('should transfer car from seller to buyer successfully', async () => {
      await upgradeableCarsContract2.addCar(make, model, initialPrice, imageHash, defaultOverrideOptions);
      await _upgradeableCarsContract2.buyCarFromContractOwner(1, TWO_CAR_TOKENS, defaultOverrideOptions);

      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider);
      _upgradeableCarsContract2 = new ethers.Contract(upgradeableCarsContract2.address, Cars2.abi, _thirdUserWallet);
      let _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _thirdUserWallet);
      await _tokenContract.approve(upgradeableCarsContract2.address, TEN_CAR_TOKENS);

      let tx = await _upgradeableCarsContract2.buyCarFromSeller(1, FOUR_CAR_TOKENS, defaultOverrideOptions);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, _upgradeableCarsContract2, 'CarBoughtFromSeller');
      assert(isEmitted, 'Event CarBoughtFromSeller was not emitted');

      let logs = utils.parseLogs(txReceipt, _upgradeableCarsContract2, 'CarBoughtFromSeller');   
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
      assert.strictEqual(logs[0]._buyer, thirdUser.wallet.address, 'Car ownership was not transfered successfully');
      assert.strictEqual(logs[0]._from, secondUser.wallet.address, 'Previous owner of the car was not valid');
      assert(logs[0]._price.eq(FOUR_CAR_TOKENS), 'Car price was not updated successfully');
      assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
      assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
    });

    it('should withdraw tokens successfully', async () => {
      let tx = await upgradeableCarsContract2.withdrawProfit(defaultOverrideOptions);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);
      let contractTokenBalance = await tokenContract.balanceOf(upgradeableCarsContract2.address);
      let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);

      assert(contractTokenBalance.eq(0));
      assert(ownerTokenBalance.eq(TWO_CAR_TOKENS));

      let isEmitted = utils.hasEvent(txReceipt, upgradeableCarsContract2, 'ProfitWithdrawal');
      assert(isEmitted, 'Event ProfitWithdrawal was not emitted');

      let logs = utils.parseLogs(txReceipt, upgradeableCarsContract2, 'ProfitWithdrawal');   
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
      assert(logs[0]._amount.eq(TWO_CAR_TOKENS), 'Invalid amount of tokens withdrawn');
    });
  });
});