const anchor = require("@coral-xyz/anchor");

async function main() {
  // Setup provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ShellfishTracking;

  console.log("Program ID:", program.programId.toBase58());
  console.log("Wallet:", provider.wallet.publicKey.toBase58());

  // Derive the counter PDA
  const [counterPDA, counterBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  );

  console.log("Counter PDA:", counterPDA.toBase58());

  // Step 1: Initialize the counter account (only needs to be done once)
  try {
    console.log("\n--- Initializing counter ---");
    await program.methods
      .initializeCounter()
      .accounts({
        counter: counterPDA,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("✓ Counter initialized successfully");
  } catch (error) {
    // Counter might already be initialized
    if (error.toString().includes("already in use")) {
      console.log("Counter already initialized, continuing...");
    } else {
      throw error;
    }
  }

  // Fetch and display counter value
  const counterData = await program.account.counter.fetch(counterPDA);
  console.log("Current counter value:", counterData.count.toString());

  // Step 2: Harvest shellfish
  const batchAccount = anchor.web3.Keypair.generate();
  
  console.log("\n--- Harvesting shellfish ---");
  console.log("Batch account:", batchAccount.publicKey.toBase58());
  
  const harvestTx = await program.methods
    .harvestShellfish("Oyster", "John Doe", "Gulf Coast")
    .accounts({
      batch: batchAccount.publicKey,
      counter: counterPDA,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([batchAccount])
    .rpc();
  
  console.log("✓ Harvest transaction signature:", harvestTx);

  // Fetch and display batch data
  const batchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
  console.log("\nBatch Details:");
  console.log("- Batch ID:", batchData.batchId.toString());
  console.log("- Species:", batchData.species);
  console.log("- Harvester:", batchData.harvester);
  console.log("- Location:", batchData.harvestLocation);
  console.log("- Harvest Time:", new Date(batchData.harvestTime.toNumber() * 1000).toISOString());
  console.log("- Is Processed:", batchData.isProcessed);
  console.log("- Is Distributed:", batchData.isDistributed);
  console.log("- Authority:", batchData.authority.toBase58());

  // Step 3: Process the shellfish
  console.log("\n--- Processing shellfish ---");
  
  const processTx = await program.methods
    .processShellfish("Cleaned and packaged at Facility XYZ on " + new Date().toISOString())
    .accounts({
      batch: batchAccount.publicKey,
      authority: provider.wallet.publicKey,
    })
    .rpc();
  
  console.log("✓ Process transaction signature:", processTx);

  // Fetch updated batch data
  const processedBatchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
  console.log("- Processing Details:", processedBatchData.processingDetails);
  console.log("- Is Processed:", processedBatchData.isProcessed);

  // Step 4: Distribute the shellfish
  console.log("\n--- Distributing shellfish ---");
  
  const distributeTx = await program.methods
    .distributeShellfish("Shipped to Restaurant Group Inc. via TruckCo on " + new Date().toISOString())
    .accounts({
      batch: batchAccount.publicKey,
      authority: provider.wallet.publicKey,
    })
    .rpc();
  
  console.log("✓ Distribution transaction signature:", distributeTx);

  // Fetch final batch data
  const finalBatchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
  console.log("- Distribution Details:", finalBatchData.distributionDetails);
  console.log("- Is Distributed:", finalBatchData.isDistributed);

  // Fetch updated counter value
  const updatedCounterData = await program.account.counter.fetch(counterPDA);
  console.log("\n--- Final State ---");
  console.log("Counter value:", updatedCounterData.count.toString());
  console.log("\n✓ Complete supply chain tracking workflow finished successfully!");
}

main()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Error:", error);
    process.exit(1);
  });