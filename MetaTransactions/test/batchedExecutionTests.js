const etherlime = require('etherlime');
const ethers = require('ethers');
const utils = ethers.utils;

const ECTools = require('../build/ECTools.json');
const MetaBatchProxy = require('../build/MetaBatchProxy.json');
const MetaToken = require('../build/MetaToken.json');
const Billboard = require('../build/Billboard.json');

describe('MetaBatchTransactions', () => {
  let deployer;
  let wallet;

  let ECToolsWrapper;
  let MetaTokenWrapper;
  let MetaBatchProxyWrapper;
  let BillboardWrapper; 

  let approveData;
  let approveDataSignature;
  let buySloganData;
  let buySloganDataSignature;

  let tokensToSpend = 100;

  before(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer();
    wallet = deployer.wallet;

    ECToolsWrapper = await deployer.deploy(ECTools);
	  MetaTokenWrapper = await deployer.deploy(MetaToken);
	  MetaBatchProxyWrapper = await deployer.deploy(MetaBatchProxy, {ECTools: ECToolsWrapper.contractAddress});
	  BillboardWrapper = await deployer.deploy(Billboard, {}, MetaTokenWrapper.contractAddress); 

    // Mint tokens
    const mintTx = await MetaTokenWrapper.contract.mint(MetaBatchProxyWrapper.contractAddress, 10000);
	  await MetaTokenWrapper.verboseWaitForTransaction(mintTx, "Minting 10000 tokens to proxy.");

    // Generate approve meta transaction
    approveData = MetaTokenWrapper.contract.interface.functions.approve.encode([BillboardWrapper.contractAddress, tokensToSpend]);        
    const approveHash = utils.solidityKeccak256(['address', 'uint256', 'bytes'], [MetaTokenWrapper.contractAddress, 0, approveData]);
    approveDataSignature = wallet.signMessage(utils.arrayify(approveHash));

    // Generate buy meta transaction
    buySloganData = BillboardWrapper.contract.interface.functions.buy.encode(["Ogi e maistor!", tokensToSpend]);
    const buyHash = utils.solidityKeccak256(['address', 'uint256', 'bytes'], [BillboardWrapper.contractAddress, 0, buySloganData]);
    buySloganDataSignature = await wallet.signMessage(utils.arrayify(buyHash));
  });

  it('execute successful transaction', async () => {
    // Execute batched transactions    
    const MetaBatchContract = MetaBatchProxyWrapper.contract;
    const MetaTokenContract = MetaTokenWrapper.contract;
    const BillboardContract = BillboardWrapper.contract;

    await MetaBatchContract.execute([MetaTokenWrapper.contractAddress, BillboardWrapper.contractAddress], [0, 0], [approveData, buySloganData], [approveDataSignature, buySloganDataSignature], {gasLimit: 4700000});
      
    const proxyBalance = await MetaTokenContract.balanceOf(MetaBatchProxyWrapper.contractAddress);
    assert(proxyBalance.eq(9900), "The balance of the proxy was not correctly lowered");

    const billboardBalance = await MetaTokenContract.balanceOf(BillboardWrapper.contractAddress);
    assert(billboardBalance.eq(tokensToSpend), "The balance of the billboard is not correct");
      
    const billboardAllowance = await MetaTokenContract.allowance(MetaBatchProxyWrapper.contractAddress, BillboardWrapper.contractAddress);
    assert(billboardAllowance.eq(0), "Incorrect allowance to the Billboard contract");

    const slogan = await BillboardContract.slogan();
    assert.strictEqual(slogan, "Ogi e maistor!", "Incorrect slogan");

    const billboardPrice = await BillboardContract.price();
    assert(billboardPrice.eq(tokensToSpend), "Incorrect price");
  });

  it('should fail and revert everything on failing second transaction', async () => {
    const MetaBatchContract = MetaBatchProxyWrapper.contract;
    const MetaTokenContract = MetaTokenWrapper.contract;

    await assert.revert(MetaBatchContract.execute([MetaTokenWrapper.contractAddress, BillboardWrapper.contractAddress], [0, 0], [approveData, buySloganData], [approveDataSignature, buySloganDataSignature], {gasLimit: 4700000}));
      
    const proxyBalance = await MetaTokenContract.balanceOf(MetaBatchProxyWrapper.contractAddress);
    assert(proxyBalance.eq(9900), "The balance of the proxy was changed");

    const billboardBalance = await MetaTokenContract.balanceOf(BillboardWrapper.contractAddress);
    assert(billboardBalance.eq(tokensToSpend), "The balance of the billboard is not correct");
      
    const billboardAllowance = await MetaTokenContract.allowance(MetaBatchProxyWrapper.contractAddress, BillboardWrapper.contractAddress);
    assert(billboardAllowance.eq(0), "Incorrect allowance to the Billboard contract");
  });

  describe('Relayer', () => {
    beforeEach(async () => {
      tokensToSpend = 200;

      approveData = MetaTokenWrapper.contract.interface.functions.approve.encode([BillboardWrapper.contractAddress, tokensToSpend]);        
      const approveHash = utils.solidityKeccak256(['address', 'uint256', 'bytes'], [MetaTokenWrapper.contractAddress, 0, approveData]);
      approveDataSignature = wallet.signMessage(utils.arrayify(approveHash));

      buySloganData = BillboardWrapper.contract.interface.functions.buy.encode(["Ogi e maistor 2", tokensToSpend]);
      const buyHash = utils.solidityKeccak256(['address', 'uint256', 'bytes'], [BillboardWrapper.contractAddress, 0, buySloganData]);
      buySloganDataSignature = await wallet.signMessage(utils.arrayify(buyHash));
    });

    it('should succeed through relayer', async () => {
      const relayerWallet = accounts[3].wallet.connect(deployer.provider);
      const RelayerMetaBatchContract = MetaBatchProxyWrapper.contract.connect(relayerWallet);
      const MetaTokenContract = MetaTokenWrapper.contract;
      const BillboardContract = BillboardWrapper.contract;

      await RelayerMetaBatchContract.execute([MetaTokenWrapper.contractAddress, BillboardWrapper.contractAddress], [0, 0], [approveData, buySloganData], [approveDataSignature, buySloganDataSignature], {gasLimit: 4700000});
        
      const proxyBalance = await MetaTokenContract.balanceOf(MetaBatchProxyWrapper.contractAddress);
      assert(proxyBalance.eq(9700), "The balance of the proxy was not correctly lowered");
  
      const billboardBalance = await MetaTokenContract.balanceOf(BillboardWrapper.contractAddress);
      assert(billboardBalance.eq(300), "The balance of the billboard is not correct");
        
      const billboardAllowance = await MetaTokenContract.allowance(MetaBatchProxyWrapper.contractAddress, BillboardWrapper.contractAddress);
      assert(billboardAllowance.eq(0), "Incorrect allowance to the Billboard contract");

      const slogan = await BillboardContract.slogan();
      assert.strictEqual(slogan, "Ogi e maistor 2", "Incorrect slogan");

      const billboardPrice = await BillboardContract.price();
      assert(billboardPrice.eq(tokensToSpend), "Incorrect price");
    })
  });
});