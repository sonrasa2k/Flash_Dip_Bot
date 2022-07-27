const Web3 = require('web3');
const wss = "https://bsc-dataseed1.binance.org/"
const contract_bot = "0x71F8c0aC242e984B92e3aEAABE8A01F7d0891349"
const privatekey = "private vi can approve"
const erc_20_abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]

async function approve(address_token){
    const web3 = new Web3(wss);
    const num_approve = parseFloat(999999999999999*(10**18)).toLocaleString('fullwide', { useGrouping: false });
    const contractToken = new web3.eth.Contract(erc_20_abi,address_token);
    const data = contractToken.methods.approve(contract_bot,num_approve).encodeABI();
    const txObject = {
        to:address_token,
        gasLimit: 3600000,
        gasPrice: "10000000000",
        data: data
    }
    const signedTx = await web3.eth.accounts.signTransaction(txObject,privatekey)
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    if(receipt.status){
        console.log("ngon")
    }
}
approve(dia chi contract token can appprove);