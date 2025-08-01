const anchor = require("@coral-xyz/anchor");

async function main() {
  // Set up the provider using the environment (make sure ANCHOR_PROVIDER_URL and ANCHOR_WALLET are set)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program using the IDL
  const program = anchor.workspace.ShellfishTracking;

  // Generate new keypairs for the batch and counter accounts.
  const batchAccount = anchor.web3.Keypair.generate();
  const counterAccount = anchor.web3.Keypair.generate();

  // Call the initializeCounter instruction to properly initialize the counter account.
  console.log("Initializing counter account...");
  const initTx = await program.methods
    .initializeCounter()
    .accounts({
      counter: counterAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([counterAccount])
    .rpc();
  console.log("Counter initialized. Transaction signature:", initTx);
  console.log("Counter account:", counterAccount.publicKey.toBase58());

  // Now call the harvest_shellfish instruction with sample parameters.
  console.log("Calling harvest_shellfish instruction...");
  const tx = await program.methods
    .harvestShellfish("Oyster", "John Doe", "Gulf Coast")
    .accounts({
      batch: batchAccount.publicKey,
      counter: counterAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([batchAccount])
    .rpc();

  console.log("Harvest transaction signature:", tx);
}

main().catch(err => {
  console.error(err);
});
