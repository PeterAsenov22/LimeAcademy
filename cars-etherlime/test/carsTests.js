const etherlime = require('etherlime');
const Cars = require('../build/Cars.json');
const CarToken = require('../build/CarToken.json');
const Oracle = require('../build/Oracle.json');

describe.only('Cars', () => {
  const ETH_PRICE_IN_USD = 140;
  const ONE_CAR_TOKEN = ethers.utils.bigNumberify('1000000000000000000');
  const ONE_AND_A_HALF_CAR_TOKENS = ethers.utils.bigNumberify('1500000000000000000');
  const TWO_CAR_TOKENS = ethers.utils.bigNumberify('2000000000000000000');
  const FOUR_CAR_TOKENS = ethers.utils.bigNumberify('4000000000000000000');
  const EIGHT_CAR_TOKENS = ethers.utils.bigNumberify('8000000000000000000');
  const TEN_CAR_TOKENS = ethers.utils.bigNumberify('10000000000000000000');
  const TEN_AND_A_HALF_CAR_TOKENS = ethers.utils.bigNumberify('10500000000000000000');
  const TWELVE_CAR_TOKENS = ethers.utils.bigNumberify('12000000000000000000');

  const owner = accounts[0];
  const secondUser = accounts[1];
  const thirdUser = accounts[2];

  const make = ethers.utils.formatBytes32String('Audi');
  const model = ethers.utils.formatBytes32String('A6');
  const initialPrice = ONE_CAR_TOKEN;
  const imageHash = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';

  const tokenName = 'Car Token'
  const tokenSymbol = 'CT'
  const tokenDecimals = 18;
  
  const defaultOverrideOptions = {
    gasLimit: 4000000
  }

  let deployer;
  let provider;
  let deployedCarTokenContractWrapper;
  let deployedCarsContractWrapper;
  let deployedOracleContractWrapper;
  let contract;
  let tokenContract;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    provider = deployer.provider;

    deployedOracleContractWrapper = await deployer.deploy(Oracle, {}, ETH_PRICE_IN_USD);
    deployedCarTokenContractWrapper = await deployer.deploy(CarToken, {}, tokenName, tokenSymbol, tokenDecimals);
    deployedCarsContractWrapper = await deployer.deploy(Cars, {}, deployedCarTokenContractWrapper.contractAddress, deployedOracleContractWrapper.contractAddress);
    contract = deployedCarsContractWrapper.contract;
    tokenContract = deployedCarTokenContractWrapper.contract;

    await tokenContract.mint(owner.wallet.address, TEN_CAR_TOKENS);
  });

  describe('initialization', () => {
    it('should initialize contract with correct values', async () => {
      let _owner = await contract.owner();
      let _contractTokenBalance = await tokenContract.balanceOf(contract.address);

      assert.strictEqual(_owner, owner.wallet.address, 'Initial contract owner does not match');
      assert(_contractTokenBalance.eq(0), 'Initial contract token balance should be zero');
    });
  });

  describe('addCar', () => {
    it('should add car successfully', async () => {
      let tx = await contract.addCar(make, model, initialPrice, imageHash);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, contract, 'CarAddedByContractOwner');
      assert(isEmitted, 'Event CarAddedByContractOwner was not emitted');

      let logs = utils.parseLogs(txReceipt, contract, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');

      assert(logs[0]._carIndex.eq(0), 'Car index was not set correctly');
      assert.strictEqual(logs[0]._make, make, 'Car make was not set correctly');
      assert.strictEqual(logs[0]._model, model, 'Car model was not set correctly');
      assert(logs[0]._initialPrice.eq(ONE_CAR_TOKEN), 'Car price was not set correctly');
    });

    it('should add second car successfully', async () => {
      await contract.addCar(make, model, initialPrice, imageHash);
      let tx = await contract.addCar(make, model, initialPrice, imageHash);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let logs = utils.parseLogs(txReceipt, contract, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
      assert(logs[0]._carIndex.eq(1), 'Car index was not set correctly');
    });

    it('should revert when adding car with empty make', async () => {
      await assert.revert(contract.addCar(ethers.utils.formatBytes32String(''), model, 1, imageHash));
    });

    it('should revert when adding car with empty model', async () => {
      await assert.revert(contract.addCar(make, ethers.utils.formatBytes32String(''), 1, imageHash));
    });

    it('should revert when adding car with empty image hash', async () => {
      await assert.revert(contract.addCar(make, model, 1, ethers.utils.formatBytes32String('')));
    });

    it('should revert when adding car with initial price less than one', async () => {
      await assert.revert(contract.addCar(make, model, 0, imageHash));
    });

    it('should revert when non-authorized user tries to add car', async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      await assert.revert(_contract.addCar(make, model, initialPrice, imageHash));
    }); 
  });

  describe('getCarInfo', () => {
    it('should return correct data', async () => {
      await contract.addCar(make, model, initialPrice, imageHash);
      let info  = await contract.getCarInfo(0);
      
      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(initialPrice), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, owner.wallet.address, 'Does not return correct value for car owner');
      assert(!info._isSecondHand, 'Does not return false for isSecondHand');
      assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
    });

    it('should revert if invalid index is passed', async () => {
      await assert.revert(contract.getCarInfo(0));
    });
  });

  describe('getCarPriceInUSD', () => {
    it('should return correct data', async () => {
      await contract.addCar(make, model, initialPrice, imageHash);

      let carPriceInUSD  = await contract.getCarPriceInUSD(0);
      let expectedPrice = initialPrice.mul(ETH_PRICE_IN_USD);

      assert(carPriceInUSD.eq(expectedPrice), 'Does not return correct car price');
    });

    it('should revert if invalid index is passed', async () => {
      await assert.revert(contract.getCarPriceInUSD(0));
    });
  });

  describe('getAddressCars', () => {   
    it('should return correct carIndexes', async () => {
      await contract.addCar(make, model, initialPrice, imageHash);
      await contract.addCar(make, model, initialPrice, imageHash);

      let carIndexes = await contract.getAddressCars(owner.wallet.address);

      assert(ethers.utils.bigNumberify(carIndexes.length).eq(2), 'Cars length should be 2');
      assert(carIndexes[0].eq(0), 'Does not return correct car index');
      assert(carIndexes[1].eq(1), 'Does not return correct car index');
    });
  });

  describe('getCarsCount', () => {
    it('should return correct cars count', async () => {
      await contract.addCar(make, model, initialPrice, imageHash);
      await contract.addCar(make, model, initialPrice, imageHash);

      let carsCount = await contract.getCarsCount();
      assert(carsCount.eq(2), 'Cars count should be 2');
    });
  });

  describe('buyCarFromContractOwner', async () => {
    let _contract;

    beforeEach(async () => {
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await contract.addCar(make, model, initialPrice, imageHash);

      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(contract.address, TWO_CAR_TOKENS);
    });

    describe('buyCarFromContractOwner function', () => {
      it('should transfer car to the buyer successfully', async () => {
        let tx = await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromContractOwner');
        assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted');
  
        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromContractOwner');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, secondUser.wallet.address, 'Car ownership was not transfered successfully');
        assert(logs[0]._price.eq(TWO_CAR_TOKENS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should transfer car to the buyer successfully without paying more than initial price', async () => {
        let tx = await _contract.buyCarFromContractOwner(0, initialPrice, defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromContractOwner');
        assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted'); 
  
        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromContractOwner');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, secondUser.wallet.address, 'Car ownership was not transfered successfully');
        assert(logs[0]._price.eq(initialPrice), 'Car price was updated');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should revert if car does not exist', async () => {
        await assert.revert(_contract.buyCarFromContractOwner(1, ONE_CAR_TOKEN, defaultOverrideOptions));
      });

      it('should revert if contract owner tries to call it', async () => {
        await assert.revert(contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if amount of ether sent is below car initial price', async () => {
        await assert.revert(_contract.buyCarFromContractOwner(0, 1000, defaultOverrideOptions));
      });

      it('should revert if contract owner is not owner of the car', async () => {
        await _contract.buyCarFromContractOwner(0, ONE_CAR_TOKEN, defaultOverrideOptions);

        await assert.revert(_contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if car is secondHand', async () => {
        await _contract.buyCarFromContractOwner(0, ONE_CAR_TOKEN, defaultOverrideOptions);

        await tokenContract.approve(contract.address, TWO_CAR_TOKENS);
        await contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        await assert.revert(_contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let info  = await _contract.getCarInfo(0);    
        assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
        assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
        assert(info._carPrice.eq(TWO_CAR_TOKENS), 'Does not return correct value for car price');
        assert.strictEqual(info._carOwner, secondUser.wallet.address, 'Does not return correct value for car owner');
        assert(info._isSecondHand, 'Does not return true for isSecondHand');
        assert.strictEqual(info._imageHash, imageHash, 'Does not return correct value for car image hash');
      });
    });

    describe('getAddressCars function', () => {
      it('should return correct indexes after transfer of ownership', async () => {
        await contract.addCar(make, model, initialPrice, imageHash);
        await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let contractOwnerCars = await _contract.getAddressCars(owner.wallet.address);
        let secondUserCars = await _contract.getAddressCars(secondUser.wallet.address);

        assert(ethers.utils.bigNumberify(contractOwnerCars.length).eq(1), 'Car has not been removed from contractOwnerCars');
        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(1), 'Car has not been added to secondUserCars');
        assert(contractOwnerCars[0].eq(1), 'Does not return correct car index');
        assert(secondUserCars[0].eq(0), 'Does not return correct car index');
      });

      it('should return correct indexes after transfer of ownership with more cars (testing removeCarFromCurrentOwner function)', async () => {
        await contract.addCar(make, model, initialPrice, imageHash);
        await contract.addCar(make, model, initialPrice, imageHash);
        await contract.addCar(make, model, initialPrice, imageHash);
        await _contract.buyCarFromContractOwner(1, TWO_CAR_TOKENS, defaultOverrideOptions);

        let contractOwnerCars = await _contract.getAddressCars(owner.wallet.address);
        let secondUserCars = await _contract.getAddressCars(secondUser.wallet.address);

        assert(ethers.utils.bigNumberify(contractOwnerCars.length).eq(3), "Invalid number of contract owner's cars");
        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(1), 'Car has not been added to secondUserCars');
        assert(contractOwnerCars[0].eq(0), "Does not return correct car index of a contract owner's car");
        assert(contractOwnerCars[1].eq(3), "Does not return correct car index of a contract owner's car");
        assert(contractOwnerCars[2].eq(2), "Does not return correct car index of a contract owner's car");
        assert(secondUserCars[0].eq(1), "Does not return correct car index of not owner's car");
      });
    });

    describe('token balances', () => {
      it('should return correct contract token balances', async () => {
        await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let contractTokenBalance = await tokenContract.balanceOf(contract.address);
        let secondUserTokenBalance = await tokenContract.balanceOf(secondUser.wallet.address);
        let contractAllowanceToSpentFromSecondUser = await tokenContract.allowance(secondUser.wallet.address, contract.address);

        assert(contractTokenBalance.eq(TWO_CAR_TOKENS));
        assert(secondUserTokenBalance.eq(EIGHT_CAR_TOKENS));
        assert(contractAllowanceToSpentFromSecondUser.eq(0));
      });
    });

    describe('getTotalSpendingsByAddress function', () => {
      it('should return correct amount of tokens spent by address', async () => {
        await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let ownerSpending = await contract.getTotalSpendingsByAddress(owner.wallet.address);
        let secondUserSpendings = await contract.getTotalSpendingsByAddress(secondUser.wallet.address);

        assert(ownerSpending.eq(0), 'Incorrect amount of tokens spent by contract owner');
        assert(secondUserSpendings.eq(TWO_CAR_TOKENS), 'Incorrect amount of tokens spent by second user');
      });
    });
  });

  describe('buyCarFromSeller', () => {
    let _contract;

    beforeEach(async () => {
      await contract.addCar(make, model, initialPrice, imageHash);
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await tokenContract.mint(thirdUser.wallet.address, TEN_CAR_TOKENS);

      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(contract.address, ONE_CAR_TOKEN);
      await _contract.buyCarFromContractOwner(0, initialPrice, defaultOverrideOptions);

      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _thirdUserWallet);
      _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _thirdUserWallet);
      await _tokenContract.approve(contract.address, TEN_CAR_TOKENS);
    });

    describe('buyCarFromSeller function', () => {
      it('should transfer the car from seller to buyer successfully', async () => {
        let tx = await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);

        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromSeller');
        assert(isEmitted, 'Event CarBoughtFromSeller was not emitted');

        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromSeller');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, thirdUser.wallet.address, 'Car ownership was not transfered successfully');
        assert.strictEqual(logs[0]._from, secondUser.wallet.address, 'Previous owner of the car was not valid');
        assert(logs[0]._price.eq(TWO_CAR_TOKENS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should revert if car does not exist', async () => {
        await assert.revert(_contract.buyCarFromSeller(1, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if ether sent is not at least twice the price of the car', async () => {
        await assert.revert(_contract.buyCarFromSeller(0, ONE_CAR_TOKEN, defaultOverrideOptions));
      });

      it('should revert if you try to buy not second-hand car', async () => {
        await contract.addCar(make, model, initialPrice, imageHash);
        await assert.revert(_contract.buyCarFromSeller(1, TWO_CAR_TOKENS, defaultOverrideOptions));
      });

      it('should revert if owner of the car tries to call it', async () => {
        await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);
        await assert.revert(_contract.buyCarFromSeller(0, FOUR_CAR_TOKENS, defaultOverrideOptions));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let info  = await _contract.getCarInfo(0);    
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
        await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let secondUserCars = await _contract.getAddressCars(secondUser.wallet.address);
        let thirdUserCars = await _contract.getAddressCars(thirdUser.wallet.address);

        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(0), 'Car has not been removed from secondUserCars');
        assert(ethers.utils.bigNumberify(thirdUserCars.length).eq(1), 'Car has not been added to thirdUserCars');
        assert(thirdUserCars[0].eq(0), 'Does not return correct car index');
      });
    });

    describe('token balances', () => {
      it('should return correct token balances', async () => {
        await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let contractTokenBalance = await tokenContract.balanceOf(contract.address);
        let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);
        let secondUserTokenBalance = await tokenContract.balanceOf(secondUser.wallet.address);
        let thirdUserTokenBalance = await tokenContract.balanceOf(thirdUser.wallet.address);

        assert(contractTokenBalance.eq(ONE_AND_A_HALF_CAR_TOKENS));
        assert(ownerTokenBalance.eq(TEN_CAR_TOKENS));
        assert(secondUserTokenBalance.eq(TEN_AND_A_HALF_CAR_TOKENS));
        assert(thirdUserTokenBalance.eq(EIGHT_CAR_TOKENS));
      });
    });

    describe('getTotalSpendingsByAddress function', () => {
      it('should return correct amount of tokens spent by address', async () => {
        await _contract.buyCarFromSeller(0, TWO_CAR_TOKENS, defaultOverrideOptions);

        let ownerSpending = await contract.getTotalSpendingsByAddress(owner.wallet.address);
        let secondUserSpendings = await contract.getTotalSpendingsByAddress(secondUser.wallet.address);
        let thirdUserSpendings = await contract.getTotalSpendingsByAddress(thirdUser.wallet.address);

        assert(ownerSpending.eq(0), 'Incorrect amount of tokens spent by contract owner');
        assert(secondUserSpendings.eq(ONE_CAR_TOKEN), 'Incorrect amount of tokens spent by second user');
        assert(thirdUserSpendings.eq(TWO_CAR_TOKENS), 'Incorrect amount of tokens spent by third user');
      });
    });
  });

  describe('withdrawProfit', async () => {
    let _contract;

    beforeEach(async () => {
      await tokenContract.mint(secondUser.wallet.address, TEN_CAR_TOKENS);
      await contract.addCar(make, model, initialPrice, imageHash);
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      let _tokenContract = new ethers.Contract(tokenContract.address, CarToken.abi, _secondUserWallet);
      await _tokenContract.approve(contract.address, TWO_CAR_TOKENS);
      await _contract.buyCarFromContractOwner(0, TWO_CAR_TOKENS, defaultOverrideOptions);
    });

    describe('withdrawProfit function', () => {
      it('should withdraw tokens successfully', async () => {
        let tx = await contract.withdrawProfit(defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
        let contractTokenBalance = await tokenContract.balanceOf(contract.address);
        let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);

        assert(contractTokenBalance.eq(0));
        assert(ownerTokenBalance.eq(TWELVE_CAR_TOKENS));
  
        let isEmitted = utils.hasEvent(txReceipt, contract, 'ProfitWithdrawal');
        assert(isEmitted, 'Event ProfitWithdrawal was not emitted');
  
        let logs = utils.parseLogs(txReceipt, contract, 'ProfitWithdrawal');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert(logs[0]._amount.eq(TWO_CAR_TOKENS), 'Invalid amount of tokens withdrawn');
      });

      it('should revert if non-authorized user tries to call it', async () => {
        await assert.revert(_contract.withdrawProfit(defaultOverrideOptions));
      });

      it('should revert if contract balance is zero', async () => {
        await contract.withdrawProfit(defaultOverrideOptions);
        await assert.revert(contract.withdrawProfit(defaultOverrideOptions));
      });
    });

    describe('token balances', () => {
      it('should return correct token balances', async () => {
       await contract.withdrawProfit(defaultOverrideOptions);

       let contractTokenBalance = await tokenContract.balanceOf(contract.address);
       let ownerTokenBalance = await tokenContract.balanceOf(owner.wallet.address);
       
       assert(contractTokenBalance.eq(0));
       assert(ownerTokenBalance.eq(TWELVE_CAR_TOKENS));
      });
    });
  });
});