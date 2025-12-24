// src/game/fheMintUtils.ts
import { ethers } from 'ethers';

// Global instance cache
let fhevmInstance: any = null;

// UMD version compatible with your working config v0.9
const RELAYER_SDK_UMD_URL = 'https://cdn.zama.org/relayer-sdk-js/0.3.0-8/relayer-sdk-js.umd.cjs';

async function getFhevmInstance(ethereumProvider: any): Promise<any> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  if (!ethereumProvider) {
    throw new Error('Ethereum provider not found');
  }

  // Dynamic SDK loading only for mint/decrypt
  if (!(window as any).relayerSDK) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RELAYER_SDK_UMD_URL;
      script.type = 'text/javascript';
      script.onload = () => {
        setTimeout(() => {
          if ((window as any).relayerSDK) {
            resolve();
          } else {
            reject(new Error('relayerSDK failed to load'));
          }
        }, 200);
      };
      script.onerror = () => reject(new Error('Error loading relayer-sdk-js UMD'));
      document.head.appendChild(script);
    });
  }

  const relayerSDK = (window as any).relayerSDK;
  if (!relayerSDK?.initSDK || !relayerSDK?.createInstance) {
    throw new Error('Relayer SDK loaded incorrectly');
  }

  await relayerSDK.initSDK();

  // EXACTLY THE SAME addresses as in your working Node.js script
  fhevmInstance = await relayerSDK.createInstance({
    aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
    kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
    inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
    verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
    verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
    chainId: 11155111,
    gatewayChainId: 10901,
    network: ethereumProvider,
    relayerUrl: 'https://relayer.testnet.zama.org'
  });

  console.log('✅ FHEVM instance created (as in your CLI script)');
  return fhevmInstance;
}

const CONTRACT_ADDRESS = '0x7e6114bAB8ADf97d88e028697a9D0CF11A6af9e0';

const CONTRACT_ABI = [
  "function mintWithConfidentialScore(address to, string memory uri, bytes32 encryptedScore, bytes calldata inputProof) external",
  "function getEncryptedScore(uint256 tokenId) external view returns (bytes32)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

function toBytes32(handle: any): string {
  if (typeof handle === 'string' && handle.startsWith('0x') && handle.length === 66) {
    return handle;
  }

  let bytes: number[] = [];

  if (Array.isArray(handle)) {
    if (handle.length !== 32) throw new Error('Array must be 32 bytes');
    bytes = handle;
  } else if (typeof handle === 'object' && handle !== null) {
    const keys = Object.keys(handle).map(k => parseInt(k)).sort((a, b) => a - b);
    if (keys.length !== 32 || keys[0] !== 0 || keys[31] !== 31) {
      throw new Error('Object must represent 32 consecutive bytes');
    }
    bytes = keys.map(k => handle[k]);
  } else {
    throw new Error('Unsupported handle type for bytes32');
  }

  // Manual hex conversion without Buffer
  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toBytes(proof: any): string {
  if (typeof proof === 'string' && proof.startsWith('0x')) {
    return proof;
  }

  let bytes: number[] = [];

  if (Array.isArray(proof)) {
    bytes = proof;
  } else if (typeof proof === 'object' && proof !== null) {
    const keys = Object.keys(proof).map(k => parseInt(k)).sort((a, b) => a - b);
    bytes = keys.map(k => proof[k]);
  } else {
    throw new Error('Unsupported proof type');
  }

  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function mintConfidentialNFT(
  wallet: any,
  score: number,
  onProgress?: (status: string) => void
): Promise<string> {
  if (!wallet) throw new Error('Wallet not connected');
  if (!Number.isInteger(score) || score < 0 || score > 4294967295) {
    throw new Error('Score must be integer from 0 to 4294967295');
  }

  try {
    onProgress?.('🔒 Encrypting score on device...');

    const ethereumProvider = await wallet.getEthereumProvider();

    const provider = new ethers.BrowserProvider(ethereumProvider);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const fhe = await getFhevmInstance(ethereumProvider);

    const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
    input.add32(score);
    const encrypted = await input.encrypt();

    const encryptedScore = toBytes32(encrypted.handles[0]);
    const inputProof = toBytes(encrypted.inputProof);

    onProgress?.('📝 Preparing transaction...');

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    let gasLimit = 12_000_000;
    try {
      onProgress?.('⛽ Estimating gas...');
      const estimated = await contract.mintWithConfidentialScore.estimateGas(
        userAddress,
        `ipfs://bafybeif4pjtchxcmndfr2aqcalblp5go36e7ndb6kasjtrcpvojv55hlia`,
        encryptedScore,
        inputProof
      );
      gasLimit = Math.floor(Number(estimated) * 1.2);
      console.log('Gas estimate:', estimated.toString());
    } catch (e) {
      console.warn('estimateGas failed — using fixed limit');
    }

    onProgress?.('🚀 Sending transaction...');

    const tx = await contract.mintWithConfidentialScore(
      userAddress,
      `ipfs://bafybeif4pjtchxcmndfr2aqcalblp5go36e7ndb6kasjtrcpvojv55hlia`,
      encryptedScore,
      inputProof,
      { gasLimit }
    );

    onProgress?.(`✅ Transaction sent! Hash: ${tx.hash}`);
    console.log('Successful mint:', tx.hash);
    return tx.hash;

  } catch (error: any) {
    console.error('Mint failed:', error);
    throw error;
  }
}

export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export async function decryptScoreForNFT(tokenId: number, wallet: any): Promise<number> {
  if (!wallet) throw new Error('Wallet not connected');
  
  try {
    const ethereumProvider = await wallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(ethereumProvider);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // 1. Get FHEVM instance
    const fhe = await getFhevmInstance(ethereumProvider);

    // 2. Get encrypted score from contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // 3. Check if we can access the NFT
    try {
      await contract.getEncryptedScore(tokenId);
    } catch (error: any) {
      if (error.message?.includes('Not owner') || error.message?.includes('execution reverted')) {
        throw new Error('Access denied: You are not the owner of this NFT');
      }
      throw error;
    }

    const encryptedScoreHandle = await contract.getEncryptedScore(tokenId);
    
    console.log('Token ID:', tokenId, 'Encrypted handle:', encryptedScoreHandle);

    // 4. Generate keypair
    const keypair = fhe.generateKeypair();
    
    // 5. Prepare parameters for userDecrypt
    const handleContractPairs = [
      {
        handle: encryptedScoreHandle,
        contractAddress: CONTRACT_ADDRESS,
      },
    ];

    const startTimestamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';
    const contractAddresses = [CONTRACT_ADDRESS];

    // 6. Create EIP-712 data for signature
    const eip712 = fhe.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimestamp,
      durationDays,
    );

    // 7. Get signature from wallet
    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message,
    );

    console.log('Generated signature:', signature);

    // 8. Perform decryption
    const result = await fhe.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      userAddress,
      startTimestamp,
      durationDays,
    );

    console.log('Decryption result:', result);

    // 9. Extract decrypted value
    const decryptedValue = result[encryptedScoreHandle];
    
    if (decryptedValue === undefined) {
      throw new Error('Decryption did not return a value');
    }

    return Number(decryptedValue);

  } catch (error: any) {
    console.error('Decryption error:', error);
    
    if (error.message?.includes('Access denied')) {
      throw error;
    }
    
    if (error.message?.includes('not authorized') || 
        error.message?.includes('not authorized to user decrypt')) {
      throw new Error('Not authorized: The NFT owner must call contract method for authorization first');
    }
    
    if (error.message?.includes('User rejected')) {
      throw new Error('Signature rejected by user');
    }
    
    throw new Error(`Decryption failed: ${error.message || 'Unknown error'}`);
  }
}

// Keep old function for compatibility
export async function decryptScore(tokenId: number, wallet: any): Promise<number> {
  return decryptScoreForNFT(tokenId, wallet);
}