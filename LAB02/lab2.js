// This lab is intended to create the rock paper scissors game using the prompt module
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
function playGame() {
    prompt.get(schema, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        // Get the user's choice
        let userChoice = result.choice.toLowerCase();
        // Map single-letter choices to full words
        if (userChoice === 'r') userChoice = 'rock';
        else if (userChoice === 'p') userChoice = 'paper';
        else if (userChoice === 's') userChoice = 'scissors';

        // Get the computer's choice
        const computerChoice = getComputerChoice();
        
        // Determine the winner
        const winnerMessage = determineWinner(userChoice, computerChoice);
        
        // Display the results
        console.log(`You chose: ${userChoice}`);
        console.log(`Computer chose: ${computerChoice}`);
        console.log(winnerMessage);
    });
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
        return 'You win!';
    }
    return 'Computer wins!';
}
// Start the game
playGame();
// To run this code, make sure you have the 'prompt' module installed.
