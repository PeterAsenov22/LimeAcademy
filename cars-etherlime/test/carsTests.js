const etherlime = require('etherlime');
const Cars = require('../build/Cars.json');

describe('Cars', () => {
  const ONE_ETHER = ethers.utils.bigNumberify('1000000000000000000');
  const ONE_AND_A_HALF_ETHER = ethers.utils.bigNumberify('1500000000000000000');
  const TWO_ETHERS = ethers.utils.bigNumberify('2000000000000000000');
  const FOUR_ETHERS = ethers.utils.bigNumberify('4000000000000000000');

  const owner = accounts[0];
  const secondUser = accounts[1];
  const thirdUser = accounts[2];
  const make = ethers.utils.formatBytes32String('Audi');
  const model = ethers.utils.formatBytes32String('A6');
  const initialPrice = ONE_ETHER;
  const defaultOverrideOptions = {
      gasLimit: 4000000
  }

  let deployer;
  let provider;
  let deployedContractWrapper;
  let contract;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    provider = deployer.provider;
    deployedContractWrapper = await deployer.deploy(Cars);
    contract = deployedContractWrapper.contract;
  });

  describe('initialization', () => {
    it('should initialize contract with correct values', async () => {
      let _owner = await contract.owner();
      let _contractBalance = await provider.getBalance(contract.address);

      assert.strictEqual(_owner, owner.wallet.address, 'Initial contract owner does not match');
      assert(_contractBalance.eq(0), 'Initial contract balance should be zero');
    });
  });

  describe('getContractBalance', async () => {
    it('should return zero at contract initialization', async () => {
      let _contractBalance = await contract.getContractBalance();
      assert(_contractBalance.eq(0), 'Initial contract balance should be zero');
    });

    it('should revert when non-authorized user tries to request contract balance', async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      await assert.revert(_contract.getContractBalance());
    });
  });

  describe('addCar', () => {
    it('should add car successfully', async () => {
      let tx = await contract.addCar(make, model, initialPrice);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, contract, 'CarAddedByContractOwner');
      assert(isEmitted, 'Event CarAddedByContractOwner was not emitted');

      let logs = utils.parseLogs(txReceipt, contract, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');

      assert(logs[0]._carIndex.eq(0), 'Car index was not set correctly');
      assert.strictEqual(logs[0]._make, make, 'Car make was not set correctly');
      assert.strictEqual(logs[0]._model, model, 'Car model was not set correctly');
      assert(logs[0]._initialPrice.eq(ONE_ETHER), make, 'Car price was not set correctly');
    });

    it('should add second car successfully', async () => {
      await contract.addCar(make, model, initialPrice);
      let tx = await contract.addCar(make, model, initialPrice);
      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let logs = utils.parseLogs(txReceipt, contract, 'CarAddedByContractOwner');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
      assert(logs[0]._carIndex.eq(1), 'Car index was not set correctly');
    });

    it('should revert when adding car with empty make', async () => {
      await assert.revert(contract.addCar(ethers.utils.formatBytes32String(''), model, 1));
    });

    it('should revert when adding car with empty model', async () => {
      await assert.revert(contract.addCar(make, ethers.utils.formatBytes32String(''), 1));
    });

    it('should revert when adding car with initial price less than one', async () => {
      await assert.revert(contract.addCar(make, model, 0));
    });

    it('should revert when non-authorized user tries to add car', async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      await assert.revert(_contract.addCar(make, model, initialPrice));
    }); 
  });

  describe('getCarInfo', () => {
    it('should return correct data', async () => {
      await contract.addCar(make, model, initialPrice);
      let info  = await contract.getCarInfo(0);
      
      assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
      assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
      assert(info._carPrice.eq(initialPrice), 'Does not return correct value for car price');
      assert.strictEqual(info._carOwner, owner.wallet.address, 'Does not return correct value for car owner');
      assert(!info._isSecondHand, 'Does not return false for isSecondHand');
    });

    it('should revert if invalid index is passed', async () => {
      await assert.revert(contract.getCarInfo(0));
    });
  });

  describe('getAddressCars', () => {   
    it('should return correct carIndexes', async () => {
      await contract.addCar(make, model, initialPrice);
      await contract.addCar(make, model, initialPrice);

      let carIndexes = await contract.getAddressCars(owner.wallet.address);

      assert(ethers.utils.bigNumberify(carIndexes.length).eq(2), 'Cars length should be 2');
      assert(carIndexes[0].eq(0), 'Does not return correct car index');
      assert(carIndexes[1].eq(1), 'Does not return correct car index');
    });
  });

  describe('getCarsCount', () => {
    it('should return correct cars count', async () => {
      await contract.addCar(make, model, initialPrice);
      await contract.addCar(make, model, initialPrice);

      let carsCount = await contract.getCarsCount();
      assert(carsCount.eq(2), 'Cars count should be 2');
    });
  });

  describe('buyCarFromContractOwner', async () => {
    let _contract;

    beforeEach(async () => {
      await contract.addCar(make, model, initialPrice);
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
    });

    describe('buyCarFromContractOwner function', () => {
      it('should transfer car to the buyer successfully', async () => {
        let tx = await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromContractOwner');
        assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted');
  
        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromContractOwner');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, secondUser.wallet.address, 'Car ownership was not transfered successfully');
        assert(logs[0]._price.eq(TWO_ETHERS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should transfer car to the buyer successfully without paying more than initial price', async () => {
        let tx = await _contract.buyCarFromContractOwner(0, {value: initialPrice, gasLimit: 4000000});
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
        await assert.revert(_contract.buyCarFromContractOwner(1, {value: ONE_ETHER, gasLimit: 4000000}));
      });

      it('should revert if contract owner tries to call it', async () => {
        await assert.revert(contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000}));
      });

      it('should revert if amount of ether sent is below car initial price', async () => {
        await assert.revert(_contract.buyCarFromContractOwner(0, {value: 1000, gasLimit: 4000000}));
      });

      it('should revert if contract owner is not owner of the car', async () => {
        await _contract.buyCarFromContractOwner(0, {value: ONE_ETHER, gasLimit: 4000000});

        await assert.revert(_contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000}));
      });

      it('should revert if car is secondHand', async () => {
        await _contract.buyCarFromContractOwner(0, {value: ONE_ETHER, gasLimit: 4000000});
        await contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});

        await assert.revert(_contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000}));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let info  = await _contract.getCarInfo(0);    
        assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
        assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
        assert(info._carPrice.eq(TWO_ETHERS), 'Does not return correct value for car price');
        assert.strictEqual(info._carOwner, secondUser.wallet.address, 'Does not return correct value for car owner');
        assert(info._isSecondHand, 'Does not return true for isSecondHand');
      });
    });

    describe('getAddressCars function', () => {
      it('should return correct indexes after transfer of ownership', async () => {
        await contract.addCar(make, model, initialPrice);
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let contractOwnerCars = await _contract.getAddressCars(owner.wallet.address);
        let secondUserCars = await _contract.getAddressCars(secondUser.wallet.address);

        assert(ethers.utils.bigNumberify(contractOwnerCars.length).eq(1), 'Car has not been removed from contractOwnerCars');
        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(1), 'Car has not been added to secondUserCars');
        assert(contractOwnerCars[0].eq(1), 'Does not return correct car index');
        assert(secondUserCars[0].eq(0), 'Does not return correct car index');
      });

      it('should return correct indexes after transfer of ownership with more cars (testing removeCarFromCurrentOwner function)', async () => {
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);
        await _contract.buyCarFromContractOwner(1, {value: TWO_ETHERS, gasLimit: 4000000});

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

    describe('getContractBalance function', () => {
      it('should return correct contract balance', async () => {
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let contractBalance = await contract.getContractBalance();
        assert(contractBalance.eq(TWO_ETHERS));
      });
    });

    describe('getTotalSpendingsByAddress function', () => {
      it('should return correct amount of ethers spent by address', async () => {
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let ownerSpending = await contract.getTotalSpendingsByAddress(owner.wallet.address);
        let secondUserSpendings = await contract.getTotalSpendingsByAddress(secondUser.wallet.address);

        assert(ownerSpending.eq(0), 'Incorrect amount of money spent by contract owner');
        assert(secondUserSpendings.eq(TWO_ETHERS), 'Incorrect amount of money spent by second user');
      });
    });
  });

  describe('buyCarFromSeller', () => {
    let _contract;

    beforeEach(async () => {
      await contract.addCar(make, model, initialPrice);
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      await _contract.buyCarFromContractOwner(0, {value: initialPrice, gasLimit: 4000000});
      let _thirdUserWallet = new ethers.Wallet(thirdUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _thirdUserWallet);
    });

    describe('buyCarFromSeller function', () => {
      it('should transfer the car from seller to buyer successfully', async () => {
        let tx = await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});
        let txReceipt = await provider.getTransactionReceipt(tx.hash);

        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromSeller');
        assert(isEmitted, 'Event CarBoughtFromSeller was not emitted');

        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromSeller');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, thirdUser.wallet.address, 'Car ownership was not transfered successfully');
        assert.strictEqual(logs[0]._from, secondUser.wallet.address, 'Previous owner of the car was not valid');
        assert(logs[0]._price.eq(TWO_ETHERS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should revert if car does not exist', async () => {
        await assert.revert(_contract.buyCarFromSeller(1, {value: TWO_ETHERS, gasLimit: 4000000}));
      });

      it('should revert if ether sent is not at least twice the price of the car', async () => {
        await assert.revert(_contract.buyCarFromSeller(0, {value: ONE_ETHER, gasLimit: 4000000}));
      });

      it('should revert if you try to buy not second-hand car', async () => {
        await contract.addCar(make, model, initialPrice);
        await assert.revert(_contract.buyCarFromSeller(1, {value: TWO_ETHERS, gasLimit: 4000000}));
      });

      it('should revert if owner of the car tries to call it', async () => {
        await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});
        await assert.revert(_contract.buyCarFromSeller(0, {value: FOUR_ETHERS, gasLimit: 4000000}));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let info  = await _contract.getCarInfo(0);    
        assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
        assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
        assert(info._carPrice.eq(TWO_ETHERS), 'Does not return correct value for car price');
        assert.strictEqual(info._carOwner, thirdUser.wallet.address, 'Does not return correct value for car owner');
        assert(info._isSecondHand, 'Does not return true for isSecondHand');
      });
    });

    describe('getAddressCars function', () => {
      it('should return correct indexes after transfer of ownership', async () => {
        await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let secondUserCars = await _contract.getAddressCars(secondUser.wallet.address);
        let thirdUserCars = await _contract.getAddressCars(thirdUser.wallet.address);

        assert(ethers.utils.bigNumberify(secondUserCars.length).eq(0), 'Car has not been removed from secondUserCars');
        assert(ethers.utils.bigNumberify(thirdUserCars.length).eq(1), 'Car has not been added to thirdUserCars');
        assert(thirdUserCars[0].eq(0), 'Does not return correct car index');
      });
    });

    describe('getContractBalance function', () => {
      it('should return correct contract balance', async () => {
        await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let contractBalance = await contract.getContractBalance();
        assert(contractBalance.eq(ONE_AND_A_HALF_ETHER));
      });
    });

    describe('getTotalSpendingsByAddress function', () => {
      it('should return correct amount of ethers spent by address', async () => {
        await _contract.buyCarFromSeller(0, {value: TWO_ETHERS, gasLimit: 4000000});

        let ownerSpending = await contract.getTotalSpendingsByAddress(owner.wallet.address);
        let secondUserSpendings = await contract.getTotalSpendingsByAddress(secondUser.wallet.address);
        let thirdUserSpendings = await contract.getTotalSpendingsByAddress(thirdUser.wallet.address);

        assert(ownerSpending.eq(0), 'Incorrect amount of money spent by contract owner');
        assert(secondUserSpendings.eq(ONE_ETHER), 'Incorrect amount of money spent by second user');
        assert(thirdUserSpendings.eq(TWO_ETHERS), 'Incorrect amount of money spent by third user');
      });
    });
  });

  describe('withdrawProfit', async () => {
    let _contract;

    beforeEach(async () => {
      await contract.addCar(make, model, initialPrice);
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      _contract = new ethers.Contract(contract.address, Cars.abi, _secondUserWallet);
      await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS, gasLimit: 4000000});
    });

    describe('withdrawProfit function', () => {
      it('should withdraw money successfully', async () => {
        let tx = await contract.withdrawProfit(defaultOverrideOptions);
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, contract, 'ProfitWithdrawal');
        assert(isEmitted, 'Event ProfitWithdrawal was not emitted');
  
        let logs = utils.parseLogs(txReceipt, contract, 'ProfitWithdrawal');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert(logs[0]._amount.eq(TWO_ETHERS), 'Invalid amount of ethers withdrawn');
      });

      it('should revert if non-authorized user tries to call it', async () => {
        await assert.revert(_contract.withdrawProfit(defaultOverrideOptions));
      });

      it('should revert if contract balance is zero', async () => {
        await contract.withdrawProfit(defaultOverrideOptions);
        await assert.revert(contract.withdrawProfit());
      });
    });

    describe('getContractBalance function', () => {
      it('should return zero', async () => {
        await contract.withdrawProfit(defaultOverrideOptions);
        let contractBalance = await contract.getContractBalance();
        assert(contractBalance.eq(0));
      });
    });
  });
});