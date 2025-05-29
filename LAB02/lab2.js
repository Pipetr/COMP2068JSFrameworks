// This lab is intended to create the rock paper scissors game using the prompt module
// The game will have three rounds
// and will determine the winner based on the user's input and the computer's random choice.
// the winner will be determined depending on the player who has the most wins after three rounds
const prompt = require('prompt');

// Define the schema for the prompt
// the user should enter one of the following choices: rock, paper, or scissors or just r, p, or s
const choices = ['rock', 'paper', 'scissors', 'r', 'p', 's'];

const schema = {
    properties: {
        choice: {
            description: 'Choose rock, paper, or scissors (or just r, p, or s)',
            conform: function (value) {
                return choices.includes(value.toLowerCase());
            }
        }
    }
};

// Start the prompt module
prompt.start();
// Function to play the game
async function playGame() {
    try {
        // Get user input
        const { choice } = await prompt.get(schema);
        const userChoice = choice.toLowerCase().replace('r', 'rock').replace('p', 'paper').replace('s', 'scissors');

        // Get computer's choice
        const computerChoice = getComputerChoice();
        console.log(`User chose: ${userChoice}`);
        console.log(`Computer chose: ${computerChoice}`);

        // Determine the winner
        const result = determineWinner(userChoice, computerChoice);
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}


// Function to get the computer's choice
//Use the Math.random() function to generate a number as computerSelection: 
// 0.00 - 0.34 => PAPER
// 0.35 - 0.67 => SCISSORS
// 0.68 - 1.00 => ROCK
function getComputerChoice() {
    const randomNumber = Math.random();
    if (randomNumber <= 0.34) {
        return 'paper';
    } else if (randomNumber <= 0.67) {
        return 'scissors';
    } else {
        return 'rock';
    }
}

// Function to determine the winner
function determineWinner(userChoice, computerChoice) {
    if (userChoice === computerChoice) {
        return 'It\'s a tie!';
    }
    if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        return 'User wins!';
    }
    return 'Computer wins!';
}

// Function to play three rounds of the game
async function playThreeRounds() {
    let userWins = 0;
    let computerWins = 0;
    const rounds = 3;

    for (let i = 0; i < rounds; i++) {
        console.log(`Round ${i + 1}`);
        const result = await playGame();
        if (result.includes('User wins')) {
            userWins++;
        } else if (result.includes('Computer wins')) {
            computerWins++;
        }
    }

    // Determine the overall winner
    if (userWins > computerWins) {
        console.log(`User wins the game with ${userWins} wins!`);
    } else if (computerWins > userWins) {
        console.log(`Computer wins the game with ${computerWins} wins!`);
    } else {
        console.log('The game is a tie!');
    }
}

// Start the game
playThreeRounds();
