const crypto = require('crypto');
const chalk = require('chalk'); 

class KeyGenerator {
    static generateKey() {
        return crypto.randomBytes(32);
    }
}

class HMACCalculator {
    static calculateHMAC(key, message) {
        return crypto.createHmac('sha256', key).update(message).digest('hex');
    }
}

class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.rulesMatrix = this.generateRulesMatrix();
    }

    generateRulesMatrix() {
        const n = this.moves.length;
        const matrix = Array.from({ length: n }, () => Array(n).fill('Draw'));

        for (let i = 0; i < n; i++) {
            for (let j = 1; j <= (n - 1) / 2; j++) {
                const winIndex = (i + j) % n;
                const loseIndex = (i - j + n) % n;
                matrix[i][winIndex] = 'Win';
                matrix[i][loseIndex] = 'Lose';
            }
        }

        return matrix;
    }

    displayHelp() {
        const header = ['v PC\\User >', ...this.moves];
        const n = this.moves.length;

        // Print header
        const border = '+' + '-'.repeat(13 + n * 10) + '+';
        console.log(border);
        console.log(chalk.bold(header.map(h => h.padEnd(10)).join('|')).padStart(13 + n * 10)); // Header row
        console.log(border);

        // Print each row
        for (let i = 0; i < n; i++) {
            const row = [this.moves[i].padEnd(10), ...this.rulesMatrix[i].map(r => r.padEnd(10))];
            console.log(`| ${row.join('|')} |`);
            console.log(border);
        }

        console.log("\nResults are from your point of view. For example:");
        console.log("If you choose Rock and the computer chooses Scissors, you Win.");
    }

    determineResult(playerMove, computerMove) {
        const playerIndex = this.moves.indexOf(playerMove);
        const computerIndex = this.moves.indexOf(computerMove);

        if (playerIndex === -1 || computerIndex === -1) {
            throw new Error("Invalid move selected. Please choose a valid move.");
        }

        return this.rulesMatrix[playerIndex][computerIndex];
    }
}

class RockPaperScissorsGame {
    constructor(moves) {
        this.moves = moves;
        this.rules = new GameRules(moves);
    }

    start() {
        const key = KeyGenerator.generateKey();
        const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        const hmac = HMACCalculator.calculateHMAC(key, computerMove);

        console.log(`HMAC: ${hmac}`);
        this.displayMenu();

        this.getUserMove((userMove) => {
            const result = this.rules.determineResult(userMove, computerMove);

            console.log(`Your move: ${userMove}`);
            console.log(`Computer move: ${computerMove}`);
            console.log(`Result: You ${result}!`);
            console.log(`HMAC key: ${key.toString('hex')}`);
        });
    }

    displayMenu() {
        console.log('Available moves:');
        this.moves.forEach((move, index) => {
            console.log(`${index + 1} - ${move}`);
        });
        console.log('0 - Exit');
        console.log('? - help');
    }

    getUserMove(callback) {
        const stdin = process.stdin;
        const stdout = process.stdout;

        stdin.resume();
        stdout.write('Enter your move: ');

        stdin.once('data', (data) => {
            const input = data.toString().trim();
            if (input === '?') {
                this.rules.displayHelp();
                this.getUserMove(callback); // Recursive call
            } else if (input === '0') {
                process.exit(0);
            } else {
                const choice = parseInt(input) - 1;
                if (choice >= 0 && choice < this.moves.length) {
                    callback(this.moves[choice]);
                } else {
                    console.log('Invalid choice. Please try again.');
                    this.getUserMove(callback); // Recursive call
                }
            }
        });
    }
}

function validateArguments(args) {
    if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
        console.error('Error: Please provide an odd number of unique moves (≥ 3).');
        console.error('Example: node game.js rock paper scissors');
        process.exit(1);
    }
}

const args = process.argv.slice(2);
validateArguments(args);

const game = new RockPaperScissorsGame(args);
game.start();
