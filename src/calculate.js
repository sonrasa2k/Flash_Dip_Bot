function profit(minBnb,minA,numA){
    const numProfit = minBnb + minBnb*(numA-minA)/minA;
    return numProfit;
}
function getAmountOut(amountIn,reserveIn,reserveOut){
    var amountInWithFee = amountIn*0.9975
    var numerator = amountInWithFee*reserveOut;
    var denominator = reserveIn + amountInWithFee;
    const amountOut = numerator / denominator;
    return amountOut;
}
function ether2Gwei(numEther,heSo = 18){
    const numGwei = Math.floor(numEther*(10**heSo)).toLocaleString('fullwide', { useGrouping: false });
    return numGwei;
}
function gwei2Ether(numGwei,heSo = 18){
    const numEther = parseFloat(numGwei/(10**heSo));
    return numEther;
}
module.exports = {profit,gwei2Ether,ether2Gwei,getAmountOut}