use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgK3B6Cr9cGz");

#[program]
pub mod shellfish_tracking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.batch_count = 0;
        Ok(())
    }

    pub fn add_batch(ctx: Context<AddBatch>, batch_id: String, origin: String) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        let batch = ShellfishBatch {
            batch_id,
            origin,
            timestamp: clock.unix_timestamp,
        };
        state.batches.push(batch);
        state.batch_count += 1;
        Ok(())
    }

    pub fn harvest_shellfish(ctx: Context<HarvestShellfish>, batch_id: String, weight_kg: u32) -> Result<()> {
        let harvest = &mut ctx.accounts.harvest;
        let clock = Clock::get()?;

        harvest.batch_id = batch_id;
        harvest.weight_kg = weight_kg;
        harvest.harvest_time = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + State::MAX_SIZE)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddBatch<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
}

#[derive(Accounts)]
pub struct HarvestShellfish<'info> {
    #[account(init, payer = user, space = 8 + Harvest::MAX_SIZE)]
    pub harvest: Account<'info, Harvest>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub batch_count: u32,
    pub batches: Vec<ShellfishBatch>,
}

impl State {
    pub const MAX_BATCHES: usize = 10;
    pub const MAX_SIZE: usize = 4 + (State::MAX_BATCHES * ShellfishBatch::MAX_SIZE);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShellfishBatch {
    pub batch_id: String,
    pub origin: String,
    pub timestamp: i64,
}

impl ShellfishBatch {
    pub const MAX_SIZE: usize = 4 + 32 + 4 + 32 + 8; // batch_id, origin, timestamp
}

#[account]
pub struct Harvest {
    pub batch_id: String,
    pub weight_kg: u32,
    pub harvest_time: i64,
}

impl Harvest {
    pub const MAX_SIZE: usize = 4 + 32 + 4 + 8; // batch_id, weight_kg, timestamp
}
