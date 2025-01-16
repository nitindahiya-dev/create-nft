import { createNft, fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { airdropIfRequired, getExplorerLink, getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();
await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

console.log("Loaded user :", user.publicKey.toBase58());

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("Set up instance for user");

// Generate a new signer for the mint address
const collectionMint = generateSigner(umi);

// Create the NFT collection (mint account) and send the transaction
const transaction = await createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    symbol: "MC",
    uri: "https://ipfs.io/ipns/k51qzi5uqu5diluzg3y6x1540yf3lh4rnvxrhp6hb78bucp4pynf4q9ihuosbk/NftMetadata.json",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true
});

// Send and confirm the transaction to create the mint account
await transaction.sendAndConfirm(umi);

// Make sure the mint account exists before fetching
try {
    // Fetch the digital asset (NFT collection) by mint address
    const createdCollectionNft = await fetchDigitalAsset(umi, collectionMint.publicKey);

    console.log(`Created Collection ..!! Address is: ${getExplorerLink(
        "address", createdCollectionNft.mint.publicKey,
        "devnet")}`);
} catch (error) {
    console.error("Error fetching digital asset:", error);
    console.log("The mint account may not have been created or not found at the address.");
}
