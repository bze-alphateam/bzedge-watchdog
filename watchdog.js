const https = require('https');
const config = require('./config.js')
const discord = require('discord.js')
const client = new discord.Client()
const alphaTeamMention = config.alphaTeamDiscordId
const iquidusConfig = config.iquidus
const insightConfig = config.insight

const minutesInMiliseconds = (minutes) => {
    return minutes * 60 * 1000
}

//check if iquidus explorer sync (a node js script) is stuck and not syncing anymore
const checkIquidusBlockHeight = (block, channel) => {
    
    const iquidusOptions = {
        hostname: iquidusConfig.url,
        port: iquidusConfig.port,
        path: '/api/getblockcount',
        method: 'GET'
    }

    const req = https.request(iquidusOptions, res => {
        console.log(`[IQUIDUS][BLOCK COUNT]response status code: ${res.statusCode}`)
        let response = ""
    
        res.on('data', d => {
            response += d
        })
        
        res.on('end', () => {
            response = parseInt(response);
            console.log("Iquidus response for latest block is " + response)
            if ((response + 10) < block.height) {
                channel.send(alphaTeamMention + " iquidus explorer is out of sync...")
            }
        })
    })

    req.on('error', error => {
        console.error(error)
        channel.send(alphaTeamMention + " iquidus explorer not answering on current block height...")
    })
      
    req.end()
}

//insight explorer (bitcore service) sometimes is showing negative confirmations on blocks. We're checking that right here!
const checkForNegativeConfirmations = (block, channel) => {
    
    const insightBlockOptions = {
        hostname: insightConfig.url,
        port: insightConfig.port,
        path: '/insight-api-bzedge-v2/block/' + block.hash,
        method: 'GET'
      }

    const req = https.request(insightBlockOptions, res => {
        console.log(`[INSIGHT][BLOCK DETAILS] response status code: ${res.statusCode}`)
        let response = ""
    
        res.on('data', d => {
            response += d
        })
        
        res.on('end', () => {
            response = JSON.parse(response)
            if (response.confirmations < 0) {
                channel.send(alphaTeamMention + " insight explorer has negative confirmations.")
            }
            checkIquidusBlockHeight(response, channel)
        })
      })
    
    req.on('error', error => {
        console.error(error)
        channel.send(alphaTeamMention + " insight not answering on block details fetch...")
    })
      
    req.end()
}

const handleInsightBlocksResponse = (blocksResponse, channel) => {
    
    let numOfBlocksFetched = blocksResponse.blocks.length 
    //make sure the response contains blocks
    if (numOfBlocksFetched === 0) {
        let message = " I'm not receiving blocks on insight response. The blocks list is empty"
        console.log(message)
        channel.send(alphaTeamMention + message)
        return
    }

    //pick latest block from list
    let lastBlock = blocksResponse.blocks[0]
    checkForNegativeConfirmations(lastBlock, channel)

    //check that latest block is not older than allowed minutes
    if ((Date.now() - (lastBlock.time * 1000)) > minutesInMiliseconds(config.allowedMinutesBetweenBlocks)) {
        let message = " No block was found in last " + config.allowedMinutesBetweenBlocks + " minutes according to insight explorer"
        console.log(message)
        channel.send(alphaTeamMention + message)
    }

    //compute average between first and last block fetched
    let firstBlock = blocksResponse.blocks[numOfBlocksFetched - 1];
    let averageBlockTime = (lastBlock.time - firstBlock.time) / numOfBlocksFetched;
    let message = " Average block time for last " + numOfBlocksFetched + " blocks is " + averageBlockTime + " seconds."
    console.log(message)
    channel.send(message)
    
    //repeat the process once every N minutes
    setTimeout(
        () => {
            checkBlocks(channel)
        },
        minutesInMiliseconds(config.checkIntervalInMinutes)
    )
}

const checkBlocks = (channel) => {
    
    const insightBlockListOptions = {
        hostname: insightConfig.url,
        port: insightConfig.port,
        path: '/insight-api-bzedge-v2/blocks?limit=20',
        method: 'GET'
    }

    const req = https.request(insightBlockListOptions, res => {
        console.log(`[INSIGHT][BLOCK LIST] response status code: ${res.statusCode}`)
        let response = ""
    
        res.on('data', d => {
            response += d
        })
        
        res.on('end', () => {
            handleInsightBlocksResponse(JSON.parse(response), channel);
        })
      })
    
    req.on('error', error => {
        console.error(error)
        channel.send(alphaTeamMention + " insight not answering...")
    })
      
    req.end()
}

client.once('ready', () => {
	console.log('Ready!')
    const channel = client.channels.cache.get(config.watchdogDiscordChannelId);
    checkBlocks(channel)
})

client.login(config.discordToken)