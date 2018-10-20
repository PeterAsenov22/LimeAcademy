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

  describe('initialization', async () => {
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

    it('should throw when non-authorized user tries to request contract balance', async () => {
      let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
      assert.revert(_contract.getContractBalance());
    });
  });

  describe('addCar', async () => {
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

    it('should throw when adding car with initial price less than one', async () => {
      assert.revert(contract.addCar(make, model, 0));
    });

    it('should throw when non-authorized user tries to add car', async () => {
      let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
      let _contract = new ethers.Contract(contract.address, Cars.abi, _notOwnerWallet);
      assert.revert(_contract.addCar(make, model, initialPrice));
    }); 
  });
});