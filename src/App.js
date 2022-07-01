import { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import { ethers } from "ethers";

const holyContractAddress = "0x21D1a8baCd8FA8c32797530c4a7905cbD33FE1aD"
const holyContractABI = [{ "inputs": [], "name": "getAddress", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "forwarder", "type": "address" }], "name": "isTrustedForwarder", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "setAddress", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_address", "type": "address" }], "name": "setTrustedForwarder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "trustedForwarder", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "versionRecipient", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "pure", "type": "function" }]
const rawProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_RPC_URL_MUMBAI)

function App()
{
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isBiconomyReady, setIsBiconomyReady] = useState(false)
    const [holyContract, setHolyContract] = useState(null)

    useEffect(() =>
    {
        if (!window.ethereum)
        {
            console.error("Metamask is required to use this DApp")
            return;
        }

        const biconomy = new Biconomy(rawProvider,
            {
                walletProvider: window.ethereum, // TODO: Web3Auth here?
                apiKey: process.env.REACT_APP_BICONOMY_API_KEY,
                debug: true
            });
        const networkProvider = new ethers.providers.Web3Provider(biconomy);
        const signer = networkProvider.getSigner("0x0285E2453B9aaC708B9e58271d2eF6f5aEA82279")

        biconomy.onEvent(biconomy.READY, () =>
        {
            // Initialize your dapp here like getting user accounts etc
            const holyContract = new ethers.Contract(
                holyContractAddress,
                holyContractABI,
                signer,
                // networkProvider.getSigner(1)
                // biconomy.getSignerByAddress("0xc116851f0F506a4A1f304f8587ed4357F17643c5")
            )
            setHolyContract(holyContract)
            setIsBiconomyReady(true)
        }).onEvent(biconomy.ERROR, (error, message) =>
        {
            // Handle error while initializing mexa
            setIsBiconomyReady(false)
            console.error(error)
            console.error(message)
        });
    }, [])

    // 

    const sendTx = async (event) =>
    {
        event.preventDefault();
        setIsSubmitting(true);

        try
        {
            const tx = await holyContract.setAddress()
            const receipt = tx.wait()
            alert('Transaction sent!');
        } catch (err)
        {
            alert(err);
        } finally
        {
            setIsSubmitting(false);
        }
    }


    return (
        <div>
            <form onSubmit={ sendTx }>
                <button type="submit" disabled={ !isBiconomyReady || isSubmitting }>{ isSubmitting ? 'Holying...' : 'Holify' }</button>
            </form>
        </div>
    );
}

export default App;
