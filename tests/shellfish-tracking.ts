import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { ShellfishTracking } from "../target/types/shellfish_tracking";
import { assert, expect } from "chai";

describe("shellfish-tracking", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.ShellfishTracking as Program<ShellfishTracking>;

  // Derive the counter PDA
  const [counterPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  );

  it("Initializes the counter", async () => {
    try {
      const tx = await program.methods
        .initializeCounter()
        .accounts({
          counter: counterPDA,
          user: provider.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Counter initialization signature:", tx);

      // Fetch and verify the counter account
      const counterAccount = await program.account.counter.fetch(counterPDA);
      assert.equal(counterAccount.count.toNumber(), 0, "Counter should be initialized to 0");
    } catch (error) {
      console.error("Error initializing counter:", error);
      throw error;
    }
  });

  it("Harvests shellfish successfully", async () => {
    // Generate a keypair for the batch account
    const batchAccount = web3.Keypair.generate();

    const species = "Oyster";
    const harvester = "John Doe";
    const location = "Gulf Coast";

    try {
      const tx = await program.methods
        .harvestShellfish(species, harvester, location)
        .accounts({
          batch: batchAccount.publicKey,
          counter: counterPDA,
          user: provider.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([batchAccount])
        .rpc();

      console.log("Harvest transaction signature:", tx);

      // Fetch and verify the batch account
      const batchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
      
      assert.equal(batchData.batchId.toNumber(), 0, "First batch should have ID 0");
      assert.equal(batchData.species, species, "Species should match");
      assert.equal(batchData.harvester, harvester, "Harvester should match");
      assert.equal(batchData.harvestLocation, location, "Location should match");
      assert.equal(batchData.isProcessed, false, "Should not be processed yet");
      assert.equal(batchData.isDistributed, false, "Should not be distributed yet");
      assert.ok(batchData.harvestTime.toNumber() > 0, "Harvest time should be set");
      assert.ok(batchData.authority.equals(provider.publicKey), "Authority should be the user");

      // Verify counter was incremented
      const counterAccount = await program.account.counter.fetch(counterPDA);
      assert.equal(counterAccount.count.toNumber(), 1, "Counter should be incremented to 1");
    } catch (error) {
      console.error("Error harvesting shellfish:", error);
      throw error;
    }
  });

  it("Processes shellfish successfully", async () => {
    // First, harvest a new batch
    const batchAccount = web3.Keypair.generate();
    
    await program.methods
      .harvestShellfish("Clam", "Jane Smith", "Pacific Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterPDA,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    // Now process it
    const processingDetails = "Cleaned and packaged at facility XYZ";
    
    const tx = await program.methods
      .processShellfish(processingDetails)
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    console.log("Process transaction signature:", tx);

    // Verify the batch was processed
    const batchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
    assert.equal(batchData.isProcessed, true, "Batch should be processed");
    assert.equal(batchData.processingDetails, processingDetails, "Processing details should match");
  });

  it("Distributes shellfish successfully", async () => {
    // First, harvest and process a batch
    const batchAccount = web3.Keypair.generate();
    
    await program.methods
      .harvestShellfish("Mussel", "Bob Brown", "Atlantic Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterPDA,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    await program.methods
      .processShellfish("Processed at facility ABC")
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    // Now distribute it
    const distributionDetails = "Shipped to Restaurant Group Inc.";
    
    const tx = await program.methods
      .distributeShellfish(distributionDetails)
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    console.log("Distribution transaction signature:", tx);

    // Verify the batch was distributed
    const batchData = await program.account.shellfishBatch.fetch(batchAccount.publicKey);
    assert.equal(batchData.isDistributed, true, "Batch should be distributed");
    assert.equal(batchData.distributionDetails, distributionDetails, "Distribution details should match");
  });

  it("Fails to process an already processed batch", async () => {
    // Harvest and process a batch
    const batchAccount = web3.Keypair.generate();
    
    await program.methods
      .harvestShellfish("Scallop", "Alice Green", "North Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterPDA,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    await program.methods
      .processShellfish("First processing")
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    // Try to process again - should fail
    try {
      await program.methods
        .processShellfish("Second processing attempt")
        .accounts({
          batch: batchAccount.publicKey,
          authority: provider.publicKey,
        })
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("AlreadyProcessed");
    }
  });

  it("Fails to distribute without processing first", async () => {
    // Harvest a batch but don't process it
    const batchAccount = web3.Keypair.generate();
    
    await program.methods
      .harvestShellfish("Crab", "Charlie White", "East Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterPDA,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    // Try to distribute without processing - should fail
    try {
      await program.methods
        .distributeShellfish("Attempted distribution")
        .accounts({
          batch: batchAccount.publicKey,
          authority: provider.publicKey,
        })
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("NotProcessedYet");
    }
  });

  it("Fails to distribute an already distributed batch", async () => {
    // Harvest, process, and distribute a batch
    const batchAccount = web3.Keypair.generate();
    
    await program.methods
      .harvestShellfish("Lobster", "David Black", "West Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterPDA,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    await program.methods
      .processShellfish("Processed")
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    await program.methods
      .distributeShellfish("First distribution")
      .accounts({
        batch: batchAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    // Try to distribute again - should fail
    try {
      await program.methods
        .distributeShellfish("Second distribution attempt")
        .accounts({
          batch: batchAccount.publicKey,
          authority: provider.publicKey,
        })
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("AlreadyDistributed");
    }
  });
});