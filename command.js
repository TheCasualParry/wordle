const { prefix } = require('./config.json')

module.exports = (client, aliases, callback) => {
  if (typeof aliases === 'string') {
    aliases = [aliases]
  }

  client.on('message', (message) => {
    const { content } = message

    aliases.forEach((alias) => {
      const command = `${prefix}${alias}`

      if (content.toLowerCase().startsWith(`${command} `) || content.toLowerCase() === command) {
        console.log(`Running the command ${command}`)
        message.content = message.content.toLowerCase()
        callback(message)
      }
    })
  })
}