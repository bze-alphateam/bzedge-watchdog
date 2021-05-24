
module.exports = {
    discordToken: "DISCORD BOT TOKEN",
    alphaTeamDiscordId: "MAIN TEAM DISCORD ID",
    watchdogDiscordChannelId: 'DISCORD CHANNEL ID WHERE THE WATCHDOG WILL SEND MESSAGES',
    allowedMinutesBetweenBlocks: 15, //minutes allowed between blocks. The watchdog will send a message and tag alpha team if the interval between two blocks is higher
    checkIntervalInMinutes: 2, //the watchdog runs in a loop and it will check all the systems in this interval
    averageBlockTimeRange: 60, // numbers of blocks to be fetched from current block to older blocks. this is used to compute the avg block time
    minBlockAverageInSeconds: 30,
    maxBlockAverageInSeconds: 120,
    heartbeatInterval:  200,
    notifyAfterEmptyBlocksList: 3,
    iquidus: {
        url: "blocks.getbze.com",
        port: 443,
    },
    insight: {
        url: "explorer.getbze.com",
        port: 443
    }
}