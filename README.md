# Decentralized Shellfish Tracking System

A decentralized application for tracking and verifying the supply chain of shellfish products using Solana and Anchor.

## 📌 Features
- Smart contract built with Rust + Anchor.
- Deployable to a local Solana validator or Devnet.
- Immutable and transparent record keeping.
- Example client for interacting with the program.

## 🛠 Tech Stack
- **Blockchain:** Solana
- **Smart Contracts:** Rust + Anchor
- **Client:** Solana Web3 / CLI

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/)
- [Anchor](https://www.anchor-lang.com/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)

### Clone and Build
```bash
git clone https://github.com/Oyilenaan/Decentralized-Shellfish-Tracking-System.git
cd Decentralized-Shellfish-Tracking-System
anchor build
```

### Run Local Validator
```bash
solana-test-validator
```

### Deploy Program Locally
```bash
anchor deploy
```

### Interact with Program
Use the Solana CLI or Anchor client to send transactions and query data.

## 🧪 Example Usage
After deploying locally, you can run:
```bash
anchor test
```

This will:
- Build the program.
- Spin up a local Solana validator.
- Deploy the program.
- Run integration tests in the `tests/` folder.

## 📜 License
This project is licensed under the [MIT License](LICENSE).


## 🤝 Contributing
Pull requests are welcome. For major changes, open an issue first to discuss what you want to change.

## 📬 Contact
- GitHub: [Oyilenaan](https://github.com/Oyilenaan)
- Email: oyilenaanbs@gmail.com
