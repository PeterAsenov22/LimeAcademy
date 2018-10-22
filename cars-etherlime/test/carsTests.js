const etherlime = require('etherlime');
const Cars = require('../build/Cars.json');

describe('Cars', () => {
  const ONE_ETHER = ethers.utils.bigNumberify('1000000000000000000');
  const TWO_ETHERS = ethers.utils.bigNumberify('2000000000000000000');

  let owner = accounts[0];
  let notOwner = accounts[1];
  let deployer;
  let provider;
  let deployedContractWrapper;
  let contract;
  let port = 8545;
  let defaultOverrideOptions = {
      gasLimit: 4000000
  }

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey, port, defaultOverrideOptions);
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
      let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
      await assert.revert(_contract.getContractBalance());
    });
  });

  describe('addCar', () => {
    let make = 'Audi'
    let model = 'A6'
    let initialPrice = ONE_ETHER;

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

    it('should revert when adding car with initial price less than one', async () => {
      await assert.revert(contract.addCar(make, model, 0));
    });

    it('should revert when non-authorized user tries to add car', async () => {
      let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
      await assert.revert(_contract.addCar(make, model, initialPrice));
    }); 
  });

  describe('getCarInfo', () => {
    let make = 'Audi'
    let model = 'A6'
    let initialPrice = ONE_ETHER;

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
    let make = 'Audi'
    let model = 'A6'
    let initialPrice = ONE_ETHER;
    
    it('should return correct carIndexes', async () => {
      await contract.addCar(make, model, initialPrice);
      await contract.addCar(make, model, initialPrice);

      let carIndexes = await contract.getAddressCars(owner.wallet.address);

      assert(ethers.utils.bigNumberify(carIndexes.length).eq(2), 'Cars length should be 2');
      assert(carIndexes[0].eq(0), 'Does not return correct car index');
      assert(carIndexes[1].eq(1), 'Does not return correct car index');
    });
  });

  describe('buyCarFromContractOwner', async () => {
    let make = 'Audi'
    let model = 'A6'
    let initialPrice = ONE_ETHER;

    describe('buyCarFromContractOwner function', () => {
      it('should transfer car to the buyer successfully', async () => {
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
  
        let tx = await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS});
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromContractOwner');
        assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted');
  
        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromContractOwner');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, notOwner.wallet.address, 'Car ownership was not transfered successfully');
        assert(logs[0]._price.eq(TWO_ETHERS), 'Car price was not updated successfully');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should transfer car to the buyer successfully without paying more than initial price', async () => {
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
  
        let tx = await _contract.buyCarFromContractOwner(0, {value: initialPrice});
        let txReceipt = await provider.getTransactionReceipt(tx.hash);
  
        let isEmitted = utils.hasEvent(txReceipt, _contract, 'CarBoughtFromContractOwner');
        assert(isEmitted, 'Event CarBoughtFromContractOwner was not emitted'); 
  
        let logs = utils.parseLogs(txReceipt, _contract, 'CarBoughtFromContractOwner');   
        assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');
        assert.strictEqual(logs[0]._buyer, notOwner.wallet.address, 'Car ownership was not transfered successfully');
        assert(logs[0]._price.eq(initialPrice), 'Car price was updated');
        assert.strictEqual(logs[0]._make, make, 'Event does not return correct value for car make');
        assert.strictEqual(logs[0]._model, model, 'Event does not return correct value for car model');
      });

      it('should revert if car does not exist', async () => {
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await assert.revert(_contract.buyCarFromContractOwner(0, {value: 1000}));
      });

      it('should revert if contract owner tries to call it', async () => {
        await contract.addCar(make, model, initialPrice);
        await assert.revert(contract.buyCarFromContractOwner(0, {value: TWO_ETHERS}));
      });

      it('should revert if amount of ether sent is below car initial price', async () => {
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await assert.revert(_contract.buyCarFromContractOwner(0, {value: 1000}));
      });

      it('should revert if car is secondHand', async () => {
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await _contract.buyCarFromContractOwner(0, {value: ONE_ETHER});
        await contract.buyCarFromSeller(0, {value: TWO_ETHERS});

        await assert.revert(_contract.buyCarFromContractOwner(0, {value: TWO_ETHERS}));
      });
    });

    describe('getCarInfo function', () => {
      it('should return correct values after transfer of ownership', async () => {
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS});

        let info  = await _contract.getCarInfo(0);    
        assert.strictEqual(info._carMake, make, 'Does not return correct value for car make');
        assert.strictEqual(info._carModel, model, 'Does not return correct value for car model');
        assert(info._carPrice.eq(TWO_ETHERS), 'Does not return correct value for car price');
        assert.strictEqual(info._carOwner, notOwner.wallet.address, 'Does not return correct value for car owner');
        assert(info._isSecondHand, 'Does not return true for isSecondHand');
      });
    });

    describe('getAddressCars function', () => {
      it('should return correct indexes after transfer of ownership', async () => {
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);
        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await _contract.buyCarFromContractOwner(0, {value: TWO_ETHERS});

        let contractOwnerCars = await _contract.getAddressCars(owner.wallet.address);
        let notOwnerCars = await _contract.getAddressCars(notOwner.wallet.address);

        assert(ethers.utils.bigNumberify(contractOwnerCars.length).eq(1), 'Car has not been removed from contractOwnerCars');
        assert(ethers.utils.bigNumberify(notOwnerCars.length).eq(1), 'Car has not been added to notOwnerCars');
        assert(contractOwnerCars[0].eq(1), 'Does not return correct car index');
        assert(notOwnerCars[0].eq(0), 'Does not return correct car index');
      });

      it('should return correct indexes after transfer of ownership with more cars (testing removeCarFromCurrentOwner function)', async () => {
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);
        await contract.addCar(make, model, initialPrice);

        let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
        let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
        await _contract.buyCarFromContractOwner(1, {value: TWO_ETHERS});

        let contractOwnerCars = await _contract.getAddressCars(owner.wallet.address);
        let notOwnerCars = await _contract.getAddressCars(notOwner.wallet.address);

        assert(ethers.utils.bigNumberify(contractOwnerCars.length).eq(3), "Invalid number of contract owner's cars");
        assert(ethers.utils.bigNumberify(notOwnerCars.length).eq(1), 'Car has not been added to notOwnerCars');
        assert(contractOwnerCars[0].eq(0), "Does not return correct car index of a contract owner's car");
        assert(contractOwnerCars[1].eq(3), "Does not return correct car index of a contract owner's car");
        assert(contractOwnerCars[2].eq(2), "Does not return correct car index of a contract owner's car");
        assert(notOwnerCars[0].eq(1), "Does not return correct car index of not owner's car");
      });
    });
  });
});