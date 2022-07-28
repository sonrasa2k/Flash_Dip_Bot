//import package
const Web3 = require('web3');
const ethers = require("ethers");
const abiDecoder = require('abi-decoder');
const calculate = require('./src/calculate');

// load config bot
const botConfig = require("./config/bot.json");
//load abi
const pancakeABI = require("./abi/pancake.json");
const botABI = require("./abi/flash_dip_bot.json");
const erc20ABI = require("./abi/erc20.json");
//add decode input
abiDecoder.addABI(pancakeABI);
// load config token
const configToken  = require("./token/"+botConfig.tokenTagetAddress+".json")

async function get_amount_will_sell(poolContract,num_bnb_pending,num_token_a_sell){
    var reserves = await poolContract.getReserves();
    let reserve_a_initial = parseFloat(reserves._reserve0/(10**configToken.N));
    let reserve_b_initial = parseFloat(ethers.utils.formatUnits(reserves._reserve1));
    var amount_a = calculate.getAmountOut(num_bnb_pending,reserve_b_initial,reserve_a_initial)
    reserve_b_initial = reserve_b_initial + num_bnb_pending*0.9975;
    reserve_a_initial = reserve_a_initial - amount_a;
    var amount_b_return = calculate.getAmountOut(num_token_a_sell,reserve_a_initial,reserve_b_initial)
    return amount_b_return;
}
async function get_amount_will_buy(poolContract,num_token_a,num_token_buy){
    var reserves = await poolContract.getReserves();
    let reserve_a_initial = parseFloat(reserves._reserve0/(10**configToken.N));
    let reserve_b_initial = parseFloat(ethers.utils.formatUnits(reserves._reserve1));
    var amount_b = calculate.getAmountOut(num_token_a,reserve_a_initial,reserve_b_initial);
    reserve_a_initial = reserve_a_initial + num_token_a*0.9975;
    reserve_b_initial = reserve_b_initial - amount_b;
    var amount_a_return = calculate.getAmountOut(num_token_buy,reserve_b_initial,reserve_a_initial)
    return amount_a_return;
}
async function bot(){
    const customWsProvider = new ethers.providers.WebSocketProvider(botConfig.rpc);
    const wallet = new ethers.Wallet(botConfig.privateKey);
    const acount = wallet.connect(customWsProvider);
    const contractBot = new ethers.Contract(botConfig.botContractAddress,botABI,acount);
    const contractToken = new ethers.Contract(ethers.utils.getAddress(botConfig.tokenTagetAddress),erc20ABI,customWsProvider);
    const contractPancake = new ethers.Contract(botConfig.pancakeAddress,pancakeABI,customWsProvider);
    const factoryContract = new ethers.Contract(
        botConfig.pancakeFactory,
        ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
        customWsProvider
    );
    const addressPair = await factoryContract.getPair(botConfig.tokenTagetAddress,botConfig.WBNB);
    const poolContract = new ethers.Contract(
        addressPair,
        ['function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'],
        customWsProvider
    );
    //get amount num token taget
    const numTokenGweis = await contractToken.balanceOf(wallet.address);
    let numToken = calculate.gwei2Ether(numTokenGweis,configToken.N);
    // log config token
    await console.log("Restart Bot ...............................");
    await console.log("Address Token Taget : ",botConfig.tokenTagetAddress);
    await console.log("Pair address : ",addressPair);
    await console.log("Amounts Token Taget : ",numToken);
    await console.log("Amounts Bnb Buy : ",configToken.BNB_BUY);
    await console.log("Amount BNB Return: ",configToken.MIN_BNB_RETURN);
    await console.log("BOT RUNNING .............................................");
    customWsProvider.on("pending", (tx) => {
        customWsProvider.getTransaction(tx).then(async function (transaction) {
            if (transaction && transaction.to === botConfig.pancakeAddress) {
                const decodedData = abiDecoder.decodeMethod(transaction.data);
                let name = ""
                try {
                    name = decodedData.name
                } catch (e) {
                    name = ""
                }
                if (numToken > 0) {
                    if (botConfig.LIST_FUNCTION_PATH_IN_1_BUY.includes(name)) {
                        const valuePending = await ethers.utils.formatUnits(transaction.value);
                        const path = decodedData.params[1].value
                        const tokenPending = path[path.length - 1]
                        if (tokenPending === botConfig.tokenTagetAddress) {
                            const amount_bnb_return = await get_amount_will_sell(poolContract, parseFloat(valuePending), numToken)
                            console.log("bnb return ", amount_bnb_return)
                            if (amount_bnb_return >= configToken.MIN_BNB_RETURN) {
                                const contractTokenAddress = ethers.utils.getAddress(botConfig.tokenTagetAddress);
                                const amountBnbBuy = calculate.ether2Gwei(configToken.BNB_BUY);
                                const amountMinBnb = calculate.ether2Gwei(configToken.MIN_BNB_RETURN)
                                const swapTxn = contractBot.swap_a_to_wbnb(contractTokenAddress, amountBnbBuy, amountMinBnb, botConfig.viLoi, {
                                    gasLimit: 3600000,
                                    gasPrice: transaction.gasPrice.toString()
                                });
                                const receipt = await swapTxn.wait();
                                if (receipt.status) {
                                    numToken = 0;
                                    await console.log("Da Ban");
                                }
                            }
                        }
                    }
                    if (botConfig.LIST_FUNCTION_PATH_IN2_BUY.includes(name)) {
                        const path = decodedData.params[2].value
                        const tokenTheyBuy = path[path.length - 1]
                        if (tokenTheyBuy === botConfig.tokenTagetAddress) {
                            const num_token_usage = decodedData.params[0].value;
                            const listAmounts = await contractPancake.getAmountsOut(num_token_usage.toString(), path);
                            const valuesPending = ethers.utils.formatUnits(listAmounts[path.length - 2]);
                            const amount_bnb_return = await get_amount_will_sell(poolContract, parseFloat(valuesPending), numToken)
                            console.log("bnb return ", amount_bnb_return)
                            if (amount_bnb_return >= configToken.MIN_BNB_RETURN) {
                                const contractTokenAddress = ethers.utils.getAddress(botConfig.tokenTagetAddress);
                                const amountBnbBuy = calculate.ether2Gwei(configToken.BNB_BUY);
                                const amountMinBnb = calculate.ether2Gwei(configToken.MIN_BNB_RETURN)
                                const swapTxn = contractBot.swap_a_to_wbnb(contractTokenAddress, amountBnbBuy, amountMinBnb, botConfig.viLoi, {
                                    gasLimit: 3600000,
                                    gasPrice: transaction.gasPrice.toString()
                                });
                                const receipt = await swapTxn.wait();
                                if (receipt.status) {
                                    numToken = 0;
                                    await console.log("Da Ban");
                                }
                            }
                        }
                    }
                } else {
                    if (botConfig.LIST_FUNCTION_PATH_IN_2_SELL.includes(name)) {
                        const path = decodedData.params[2].value
                        const tokenTheySell = path[0]
                        if (tokenTheySell === botConfig.tokenTagetAddress) {
                            const num_token_b_they_sell = decodedData.params[0].value;
                            const num_token_b_they_sell_ether = num_token_b_they_sell / (10 ** configToken.N);
                            let amountsTokenReturn = await get_amount_will_buy(poolContract, num_token_b_they_sell_ether, configToken.BNB_BUY);
                            console.log(amountsTokenReturn);
                            if (amountsTokenReturn >= configToken.AMOUNTS_TOKEN_TAGET) {
                                const amountMinToken = calculate.ether2Gwei(configToken.AMOUNTS_TOKEN_TAGET, configToken.N);
                                const amountBnbBuy = calculate.ether2Gwei(configToken.BNB_BUY);
                                const contractTokenAddress = ethers.utils.getAddress(botConfig.tokenTagetAddress);
                                const swapTxn = await contractBot.swap_wbnb_to_a(contractTokenAddress, amountMinToken, botConfig.viLoi, {
                                    gasLimit: 3600000,
                                    gasPrice: transaction.gasPrice.toString(),
                                    value: amountBnbBuy
                                });
                                const receipt = await swapTxn.wait();
                                if (receipt.status) {
                                    const newNumTokenGweis = await contractToken.balanceOf(wallet.address);
                                    numToken = calculate.gwei2Ether(newNumTokenGweis, configToken.N);
                                    await console.log("Da Mua");
                                }

                            }
                        }
                    }
                }
            }
        });
    });
}
bot();



