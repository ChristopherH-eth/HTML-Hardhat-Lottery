import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

/**
 * @param LotteryEntrance() allows the user to enter the lottery.
 */

export default function LotteryEntrance() {
    const { chainId: chaindIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chaindIdHex)
    const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    /**
     * @param filter listens for "WinnerPicked" emit from Lottery contract.
     */

    const filter = {
        address: lotteryAddress,
        topics: [ethers.utils.id("WinnerPicked(address)")],
    }

    // State hooks
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    /**
     * @param enterLottery() calls the enterLottery() function from the Lottery smart contract
     */

    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    })

    /**
     * @param getEntranceFee() calls the getEntranceFee() function from the Lottery smart contract
     */

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    /**
     * @param getNumPlayers() calls the getNumPlayers() function from the Lottery smart contract
     */

    const { runContractFunction: getNumPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    /**
     * @param getRecentWinner() calls the getRecentWinner() function from the Lottery smart contract
     */

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    /**
     * @dev Code blocks below dynamically updates the lottery entrance fee, number of current players,
     * @dev and most recent winner on the Lottery UI.
     * @param updateUI() when called will update the Lottery UI.
     */

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numPlayersFromCall = (await getNumPlayers()).toString()
        const recentWinnerFromCall = (await getRecentWinner()).toString()
        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
    }

    /**
     * @dev This effect hook looks for a change in ui elements to re-render the page.
     */

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled, filter])

    /**
     * @param handleSuccess handles a successful transaction for notification and updates the UI.
     */

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    /**
     * @param handleNewNotification displays the transaction notification to the user.
     */

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            {lotteryAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterLottery({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Lottery</div>
                        )}
                    </button>
                    <div>Entrance Fee {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div>
                    <div>Players: {numPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No Lottery Address Detected</div>
            )}
        </div>
    )
}
