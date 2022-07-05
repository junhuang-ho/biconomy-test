import { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import { ethers } from "ethers";
import
{
    NotificationContainer,
    NotificationManager
} from "react-notifications";
import "react-notifications/lib/notifications.css";

const holyContractAddress = "0x21D1a8baCd8FA8c32797530c4a7905cbD33FE1aD"
const holyContractABI = [{ "inputs": [], "name": "getAddress", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "forwarder", "type": "address" }], "name": "isTrustedForwarder", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "setAddress", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_address", "type": "address" }], "name": "setTrustedForwarder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "trustedForwarder", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "versionRecipient", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "pure", "type": "function" }]


function App()
{
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [biconomy, setBiconomy] = useState(null)
    const [isBiconomyReady, setIsBiconomyReady] = useState(false)
    const [holyContract, setHolyContract] = useState(null)
    const [selectedAddress, setSelectedAddress] = useState("");
    const [toggle, setToggle] = useState(false)
    const [holyAddr, setHolyAddr] = useState("")

    useEffect(() =>
    {
        const init = async () =>
        {
            if (
                typeof window.ethereum !== "undefined" &&
                window.ethereum.isMetaMask
            )
            {
                const provider = window["ethereum"];
                await provider.enable();
                const jsonRpcProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_RPC_URL_MUMBAI)
                const biconomy = new Biconomy(jsonRpcProvider, {
                    walletProvider: window.ethereum,
                    apiKey: process.env.REACT_APP_BICONOMY_API_KEY,
                    debug: true
                });
                setBiconomy(biconomy)

                const walletProvider = new ethers.providers.Web3Provider(biconomy);
                const walletSigner = walletProvider.getSigner();

                const userAddress = await walletSigner.getAddress()
                setSelectedAddress(userAddress);

                biconomy.onEvent(biconomy.READY, () =>
                {
                    // Initialize your dapp here like getting user accounts etc
                    const holyContract = new ethers.Contract(
                        holyContractAddress,
                        holyContractABI,
                        biconomy.getSignerByAddress(userAddress)
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
            } else
            {
                console.warn("METAMASK NOT INSTALLED")
            }
        }
        init()
    }, [])

    useEffect(() =>
    {

        const getHolyAddress = async () =>
        {
            const holyAddress = await holyContract.getAddress()
            setHolyAddr(holyAddress)
        }

        console.log("TOGGLER")
        if (isBiconomyReady)
        {
            getHolyAddress()
        }

    }, [toggle, isBiconomyReady])

    // 

    const sendTx = async (event) =>
    {
        event.preventDefault();
        setIsSubmitting(true);

        try
        {
            if (holyContract && selectedAddress)
            {
                const { data } = await holyContract.populateTransaction.setAddress()
                const provider = biconomy.getEthersProvider()
                const txParams = {
                    data: data,
                    to: holyContractAddress,
                    from: selectedAddress,
                    // signatureType: "EIP712_SIGN" // just to get sign prompt in typed msg format
                    // https://docs.biconomy.io/products/enable-gasless-transactions/choose-an-approach-to-enable-gasless/eip-2771/2.-code-changes/sdk#3.-initialize-your-dapp-after-mexa-initialization
                };

                try
                {
                    const tx = await provider.send("eth_sendTransaction", [txParams])
                    console.log("Transaction hash : ", tx);
                    console.log("waiting confirmation. . .")

                    //event emitter methods
                    provider.once(tx, (transaction) =>
                    {
                        // Emitted when the transaction has been mined
                        setToggle(!toggle)
                        NotificationManager.success("tx confirmed on chain", "Message", 3000);
                        console.log("Transaction confirmed on chain");
                        console.log(transaction);
                        // setTransactionHash(tx);
                        // getQuoteFromNetwork();
                    })

                    console.log('settle')

                }
                catch (err)
                {
                    console.error("handle errors like signature denied here");
                    console.error(err);
                }


                // const tx = await holyContract.setAddress()
                // const receipt = tx.wait()
                // alert('Transaction sent!');
            } else
            {
                console.error("NO CONTRACT FOUND")
            }
        } catch (err)
        {
            console.log(err);
        } finally
        {
            setIsSubmitting(false);
        }
    }


    return (
        <div>
            <div>{ `address: ${ selectedAddress }` }</div>
            <form onSubmit={ sendTx }>
                <button type="submit" disabled={ !isBiconomyReady || isSubmitting }>{ isSubmitting ? 'Holying...' : 'Holify' }</button>
            </form>
            <button
                onClick={ () => { setToggle(!toggle) } }
            >
                refresh
            </button>
            <div>{ `holy addr: ${ holyAddr }` }</div>
            <NotificationContainer />
        </div>
    );
}

export default App;
