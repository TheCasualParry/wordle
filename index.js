const Discord = require('discord.js')
const fetch = require('node-fetch')
const { Headers } = require('node-fetch')
const fs = require('fs')

const client = new Discord.Client()

const config = require('./config.json')
const command = require('./command')

const allowed_words = JSON.parse(fs.readFileSync("allowed_words.json"))
const possible_words = JSON.parse(fs.readFileSync("possible_words.json"))
var word_guess;
var attempts = 0;
var yellow_letters = []
var green_letters = []
var gray_letters = []
var gray = false

function removeItemFromArr(arr, item) {

    let i = arr.indexOf(item)

    if (i !== -1) arr.splice(i, 1)

}

async function time(channel) {

    await channel.send('.')

}

function offset(j1, j2, word) {

    j2 = Math.ceil(j2 / 2)

    if (word > allowed_words[j1]) {

        if (j1 + j2 > allowed_words.length) j2 = Math.ceil(j2 / 2)
        j1 += j2

    } else {

        if (j1 - j2 < 0) j2 = Math.ceil(j2 / 2)
        j1 -= j2

    }

    return { j1, j2 }

}

function checkIfAllowed(word) {

    if (word.length != 5) return false;

    let j1 = Math.ceil(allowed_words.length / 2)
    let j2 = j1

    while (j1 > -5 && j1 < allowed_words.length + 5) {

        console.log(allowed_words[j1])
        console.log(j2)
        console.log(j1)

        if (word != allowed_words[j1]) {

            if ((word > allowed_words[j1] && word < allowed_words[j1 + 1]) || (word > allowed_words[j1 - 1] && word < allowed_words[j1])) return false

            let offsetObj = offset(j1, j2, word)
            j1 = offsetObj.j1
            j2 = offsetObj.j2
            console.log(word)

        } else {

            return true

        }

    }

    return false;

}

function checkIfCorrect(word) {

    let response = ""
    let arr = []

    if (word != word_guess) {

        yellow_letters = []
        green_letters = []
        gray_letters = word

        for (i = 0; i < word.length; i++) {

            let indexGray = gray_letters.indexOf(word[i])

            if (word[i] != word_guess[i]) {

                if (word_guess.includes(word[i]) && (yellow_letters.includes(word[i]) ? green_letters.includes(word[i]) : !green_letters.includes[word[i]])) {

                    if (indexGray !== -1) {

                        yellow_letters.push(word[i])
                        arr.push({ letter: word[i], color: "yellow" })
                        gray_letters[indexGray] = ''

                    } else arr.push({ letter: word[i], color: "gray" })

                } else {

                    arr.push({ letter: word[i], color: "gray" })

                }

            } else {

                if (indexGray !== -1) {

                    green_letters.push(word[i])
                    removeItemFromArr(yellow_letters, word[i])
                    if (arr.findIndex(x => x.letter == word[i]) !== -1) arr[arr.findIndex(x => x.letter == word[i])].color = "gray"
                    arr.push({ letter: word[i], color: "green" })
                    gray_letters[indexGray] = ''

                }

            }

        }

        gray = false;

        for (i = 0; i < arr.length; i++) {

            if (arr[i].color == "gray") {

                if (!gray) {

                    response = response + "*" + arr[i].letter
                    gray = true

                }
                else if (gray) response += arr[i].letter

            }
            else if (arr[i].color == "yellow") {

                if (gray) {

                    response += "*"
                    gray = false

                }

                response += arr[i].letter

            }
            else if (arr[i].color == "green") {

                if (gray) {

                    response += "*"
                    gray = false

                }

                response += arr[i].letter.toUpperCase()

            }

        }

    } else {

        green_letters = word
        response = word.toUpperCase()

    }
    if (gray) {

        response += "*"
        gray = false

    }

    return { text: response, solved: green_letters.length == 5 }

}

client.on('ready', () => {

    console.log('The client is ready!')

    command(client, ['time'], (message) => {

        let ping = message.createdTimestamp;

        time(message.channel);
        setTimeout(function () {

            message.channel.lastMessage.edit('Ping: ' + (message.channel.lastMessage.createdTimestamp - ping) + " ms")

        }, 500)

    })

    command(client, ['wins'], (message) => {

        let data = fs.readFileSync('users.json', 'utf8')

        data = JSON.parse(data);

        let text = "";

        text += data[0].username;
        text += ": ";
        text += data[0].wins;

        for (let i = 1; i < data.length; i++) {

            text += "\n";
            text += data[i].username;
            text += ": ";
            text += data[i].wins;

        }

        message.channel.send(text);

    })

    command(client, ['wordle'], (message) => {

        let word = message.content.replace("!wordle ", "")

        if (attempts == 0) {

            word_guess = possible_words[Math.floor(Math.random() * possible_words.length)]
            console.log(word_guess)

        }

        if (checkIfAllowed(word)) {

            let response = checkIfCorrect(word);

            console.log(response)

            message.channel.send(response.text)
            attempts++

            if (response.solved) {

                message.channel.send("You won!")
                attempts = 0
                let data = fs.readFileSync('users.json', 'utf8')
                data = JSON.parse(data);

                let index = data.findIndex(x => x.username == message.author.username)

                if (index === -1) data.push({ "username": message.author.username, "wins": 1 })
                else data[index].wins++;

                data = JSON.stringify(data);

                fs.writeFileSync('users.json', data)

            }
            else if (attempts == 6) {

                message.channel.send("Too bad! The answer was: " + word_guess)
                attempts = 0

            }

        } else {

            message.channel.send("Word not valid")

        }

    })

})

client.login(config.token)