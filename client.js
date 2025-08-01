const anchor = require("@coral-xyz/anchor");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShellfishTracking;

  // Generate keypairs for both accounts
  const counterAccount = anchor.web3.Keypair.generate();
  const batchAccount = anchor.web3.Keypair.generate();

  // Step 1: Initialize the counter account via your program instruction
  console.log("Initializing counter...");
  await program.methods
    .initializeCounter()
    .accounts({
      counter: counterAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([counterAccount])
    .rpc();
  console.log("Counter initialized:", counterAccount.publicKey.toBase58());

  // Step 2: Call harvest_shellfish
  console.log("Calling harvest_shellfish...");
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

  console.log("Transaction signature:", tx);
}

main().catch(console.error);
