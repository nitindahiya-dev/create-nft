import { createNft, fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { airdropIfRequired, getExplorerLink, getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { generateSigner, keypairIdentity, percentAmount, publicKey } from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();
await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

console.log("Loaded user :", user.publicKey.toBase58());

// Initialize Umi
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("Set up instance for user");

// Ensure collection address is valid
const collectionAddress = publicKey("6yibd8UEFarUvN46Rgab5or98bHi5tkijWT9tBJfa8ra");

console.log(`Creating NFT...`);

// Generate mint keypair for the new NFT
const mint = generateSigner(umi);

try {
    // Create the NFT
    const transaction = await createNft(umi, {
        mint,
        name: "Pug",
        uri: "https://ipfs.io/ipns/k51qzi5uqu5diluzg3y6x1540yf3lh4rnvxrhp6hb78bucp4pynf4q9ihuosbk/NftMetadata.json",
        sellerFeeBasisPoints: percentAmount(0),
        collection: {
            key: collectionAddress,
            verified: false, // Ensure the collection is marked correctly
        },
    });

    // Send and confirm the transaction
    await transaction.sendAndConfirm(umi);
    console.log("NFT created successfully!");

    // Fetch and log the created NFT details
    const createdNft = await fetchDigitalAsset(umi, mint.publicKey);
    console.log(
        `Created NFT address is: ${getExplorerLink(
            "address",
            createdNft.mint.publicKey,
            "devnet"
        )}`
    );
} catch (error) {
    console.error("Error while creating NFT:", error);
}
