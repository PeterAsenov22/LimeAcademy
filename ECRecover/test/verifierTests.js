const etherlime = require('etherlime');
const ethers = require('ethers');
const ECTools = require('../build/ECTools.json');
const ECVerifier = require('../build/ECVerifier.json');

describe('ECVerifier', () => {
  const owner = accounts[0];
  const accountFour = accounts[3];

  let deployer;
  let ECVerifierWrapper
  let verifierContract;
  let accountFourWallet;

  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
    accountFourWallet = new ethers.Wallet(accountFour.secretKey, deployer.provider);

    let ECToolsWrapper = await deployer.deploy(ECTools);
    ECVerifierWrapper = await deployer.deploy(ECVerifier, {ECTools: ECToolsWrapper.contractAddress});
    verifierContract = ECVerifierWrapper.contract;
  });

  it('should recover the signer address successfully', async () => {
    let message = 'Test message.';
    let msgHash = ethers.utils.solidityKeccak256(['string'], [message]);
    let dataBytes = ethers.utils.arrayify(msgHash);    
    let signature = await accountFourWallet.signMessage(dataBytes);
    
    let localVerify = ethers.utils.verifyMessage(dataBytes, signature);
    let remoteVerify = await verifierContract.verify(dataBytes, signature);
    
    assert.strictEqual(accountFour.wallet.address, localVerify, "The message is not signed by account four")
    assert.strictEqual(localVerify, remoteVerify, "Invalid address recovered");
  });

  it('should return different address if the data is tampered', async () => {
    let message = 'Test message.';
    let msgHash = ethers.utils.solidityKeccak256(['string'], [message]);
    let dataBytes = ethers.utils.arrayify(msgHash);    
    let signature = await accountFourWallet.signMessage(dataBytes);

    let tamperedMsg = 'Test message';
    let tamperedMsgHash = ethers.utils.solidityKeccak256(['string'], [tamperedMsg]);
    let tamperedDataBytes = ethers.utils.arrayify(tamperedMsgHash);

    let localVerify = ethers.utils.verifyMessage(dataBytes, signature);
    let remoteVerify = await verifierContract.verify(tamperedDataBytes, signature);
    
    assert.strictEqual(accountFour.wallet.address, localVerify, "The message is not signed by account four")
    assert.notEqual(localVerify, remoteVerify, "Invalid address recovered");
  });
});