# Rune-Marketplace(bitcoin pump.fun)

Rune marketplace imitating pump.fun of solana.

## Table of Contents

- [Configuration](#configuration)
- [Installation](#installation)
- [Usage](#usage)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contact](#contact)

## Configuration
Configuration settings are sourced from a `.env` file and a config module. Ensure you have the necessary environment variables set up in your `.env` file.

## Installation
1. Clone the repository:
    ```bash
    https://github.com/taprwhiz/rune-pump-fun-fe.git
    cd rune-pump-fun-fe
    ```

2. Install the dependencies for frontend & backend:
    ```bash
    cd frontend(backend)
    npm install
    ```

3. Create an `.env` file and add your environment variables for backend:
    ```plaintext
    PORT=
    MONGO_URI=
    TESTNET=
    UNISAT_TOKEN=
    ADMIN_PAYMENT_ADDRESS=
    ADMIN_PRIVATE_KEY=
    BIS_KEY=
    ```
    You can reference .env.example file configuration.

4. Start the server for frontend & backend:
    ```bash
    npm start
    ```

## Usage
After starting the server, the application will be running on the specified port. By default, it is set to port 5173. You can see the homepage at http://localhost:5173. You can etch the rune and can buy/sell at this website.


## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am "Add new feature"`).
4. Push your branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## Contact
If you have any question, please feel free contact me via Discord or Telegram.
- Twitter - @ptcbink
- Telegram - @ptcbink
