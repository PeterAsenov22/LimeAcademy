const etherlime = require('etherlime');
const ethers = require('ethers');
const Oracle = require('../build/Oracle.json');

describe('OracleContract', () => {
  const ETHER_PRICE_USD = 140;

  const owner = accounts[0];
  const secondUser = accounts[1];

  let deployer;
  let provider;
  let deployedOracleContractWrapper;
  let oracleContract;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    provider = deployer.provider;
    deployedOracleContractWrapper = await deployer.deploy(Oracle, {}, ETHER_PRICE_USD);
    oracleContract = deployedOracleContractWrapper.contract;
  });

  describe('initialization', () => {
    it('should initialize contract with correct values', async () => {
      let etherPriceInUSD = await oracleContract.ethPriceInUSD();
      let lastEtherPriceInUSD = await oracleContract.lastEthPriceInUSD();
      assert(etherPriceInUSD.eq(ETHER_PRICE_USD), 'Ether price in USD was not set correctly');
      assert(lastEtherPriceInUSD.eq(0), 'Last ether price in USD does not return correct value');
    });
  });

  describe('setPrice function', () => {
    it('should update price correctly', async () => {
      const newEthPriceInUSD = 200;
      const oldEthPriceInUSD = ETHER_PRICE_USD;

      await oracleContract.setPrice(newEthPriceInUSD);

      let etherPriceInUSD = await oracleContract.ethPriceInUSD();
      let lastEtherPriceInUSD = await oracleContract.lastEthPriceInUSD();

      assert(etherPriceInUSD.eq(newEthPriceInUSD), 'Ether price in USD was not updated correctly');
      assert(lastEtherPriceInUSD.eq(oldEthPriceInUSD), 'Last ether price in USD was not updated correctly');
    });

    it('should update price correctly and emit event', async () => {
      const newEthPriceInUSD = 200;
      const oldEthPriceInUSD = ETHER_PRICE_USD;

      let tx = await oracleContract.setPrice(newEthPriceInUSD);

      let txReceipt = await provider.getTransactionReceipt(tx.hash);

      let isEmitted = utils.hasEvent(txReceipt, oracleContract, 'RateChanged');
      assert(isEmitted, 'Event RateChanged was not emitted');

      let logs = utils.parseLogs(txReceipt, oracleContract, 'RateChanged');
      assert(ethers.utils.bigNumberify(logs.length).eq(1), 'Logs count should be one');

      assert(logs[0]._oldPrice.eq(oldEthPriceInUSD), 'Old ether price in USD was not updated correctly');
      assert(logs[0]._newPrice.eq(newEthPriceInUSD), 'Ether price in USD was not updated correctlyy');
    });

    it('should revert if the new Eth price is invalid', async () => {
      await assert.revert(oracleContract.setPrice(0));
    });

    it('should revert if not called by owner', async () => {
      let _secondUserWallet = new ethers.Wallet(secondUser.secretKey, provider);
      let _contract = new ethers.Contract(oracleContract.address, Oracle.abi, _secondUserWallet);
      await assert.revert(_contract.setPrice(100));
    });
  });
});