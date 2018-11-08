const fs = require('fs');
const ethers = require('ethers');
const ecies = require('eth-ecies');
const ipfsApi = require('ipfs-api');

function readFilesAndEncrypt(publicKey) {
  const dirPath = './files';
  const dirFiles = [];

  try {
    const files = fs.readdirSync(dirPath);

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = `${dirPath}/${fileName}`;
  
      const fileContent = fs.readFileSync(filePath);
      const fileObj = {
        path: fileName,
        content: encryptFileWithPublicKey(fileContent, publicKey)
      }

      dirFiles.push(fileObj);
    }

    return dirFiles;
  } catch (err) {
    console.log(err);
  }
}

function encryptFileWithPublicKey(bufferContent, publicKey) {
  const bufferPublicKey = Buffer.from(publicKey.substring(4), 'hex');
  return ecies.encrypt(bufferPublicKey, bufferContent);
}

function decryptFileWithPrivateKey(bufferEncryptedContent, privateKey) {
  const bufferPrivateKey = Buffer.from(privateKey.substring(2), 'hex');
  return ecies.decrypt(bufferPrivateKey, bufferEncryptedContent);
}

async function uploadFilesToIpfsAndReadThem() {
  try {
    const ipfsNode = ipfsApi();
    const wallet = ethers.Wallet.createRandom();
    const files = readFilesAndEncrypt(wallet.signingKey.publicKey);

    const options = {
      wrapWithDirectory: true
    }
  
    const result = await ipfsNode.add(files, options);
    const wrapperFolderHash = result[files.length].hash;
    console.log('IPFS folder hash: ' + wrapperFolderHash);
    
    fs.mkdirSync(wrapperFolderHash);
    const filesResult = await ipfsNode.files.get(wrapperFolderHash);
    filesResult.forEach((file) => {
      if (file.content) {
        file.content = decryptFileWithPrivateKey(file.content, wallet.privateKey);
        fs.writeFileSync(`./${file.path}`, file.content, 'utf8');
      }
    });
  } catch (err) {
    console.log(err);
  }
}

uploadFilesToIpfsAndReadThem();