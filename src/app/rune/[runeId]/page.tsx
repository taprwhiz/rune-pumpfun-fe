"use client";

import {
  Button,
  Card,
  CardBody,
  Input,
  Progress,
  Tab,
  Tabs,
} from "@nextui-org/react";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  etchingRuneFunc,
  getPumpActionFunc,
  getRuneInfoFunc,
  preEtchingRuneFunc,
  pumpBuyFunc,
  pumpPreBuyFunc,
  pumpPreSellFunc,
  pumpSellFunc,
} from "../../api/requests";
import { MainContext } from "../../contexts/MainContext";
import {
  displayAddress,
  displayPercentage,
  unisatSignPsbt,
} from "../../utils/pump";
import { SATS_MULTIPLE } from "../../config/config";
import useSocket from "../../hooks/useSocket";
import { TradingChart } from "../../components/TVChart/TradingChart";
import { coinInfo } from "../../utils/types";
import { useParams } from "next/navigation";
import { getTimeDifference } from "../../utils/util";

export default function CreateRune() {
  let { runeId }: any = useParams();

  runeId = decodeURIComponent(runeId);

  const [coin, setCoin] = useState<coinInfo>({
    _id: "string",
    runeId,
    name: "Rune Name",
    creator: "Abra",
    ticker: "12345",
    url: "url",
    reserveOne: 100,
    reserveTwo: 123,
    token: "string",
    marketcap: 156743,
    replies: 27,
    description: "This is Description",
    twitter: "twitter",
    date: new Date("2024-05-01"),
  } as coinInfo);
  const { userInfo } = useContext(MainContext);
  const socket = useSocket();

  const [runeInfo, setRuneInfo] = useState<any>({});

  // Buy
  const [buyFlag, setBuyFlag] = useState<boolean>(false);
  const [buyRuneAmount, setBuyRuneAmount] = useState<string>("");
  const [buyPsbtData, setBuyPsbtData] = useState<{
    psbt: string;
    requestId: string;
  }>({ psbt: "", requestId: "" });

  // Sell
  const [sellFlag, setSellFlag] = useState<boolean>(false);
  const [sellRuneAmount, setSellRuneAmount] = useState<string>("");
  const [pumpActions, setPumpActions] = useState<any[]>([]);
  const [process, setProcess] = useState<number>(0);

  const [userList, setUserList] = useState<any[]>([]);

  const [slippage, setSlippage] = useState<string>("3");
  // const [runeId, setRuneId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [estimatePrice, setEstimatePrice] = useState<number>(0);

  const handlePreBuy = async () => {
    try {
      if (userInfo.userId && runeId && buyRuneAmount) {
        setLoading(true);
        const res = await pumpPreBuyFunc(
          userInfo.userId,
          runeId,
          buyRuneAmount,
          slippage
        );
        setBuyPsbtData(res?.requestData);
        setLoading(false);
        const ePrice = res?.estimatePrice;
        if (ePrice) {
          setBuyFlag(true);
          setSellFlag(false);
          setEstimatePrice(ePrice);
        }
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleBuy = async () => {
    try {
      if (
        userInfo.userId &&
        runeId &&
        buyRuneAmount &&
        estimatePrice &&
        slippage &&
        buyPsbtData
      ) {
        setLoading(true);
        const signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
        const res = await pumpBuyFunc(
          userInfo.userId,
          runeId,
          buyRuneAmount,
          estimatePrice,
          buyPsbtData.requestId,
          slippage,
          signedPsbt
        );
        if (res.status) {
          toast.success(res.msg);
          initialize();
        }
        setBuyFlag(false);
        setLoading(false);
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setBuyFlag(false);
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handlePreSell = async () => {
    try {
      if (userInfo.userId && runeId && sellRuneAmount) {
        setLoading(true);
        const res = await pumpPreSellFunc(
          userInfo.userId,
          runeId,
          sellRuneAmount,
          slippage
        );
        const ePrice = res?.estimatePrice;
        console.log("estimatePrice :>> ", ePrice);
        setEstimatePrice(ePrice);
        setSellFlag(true);
        setBuyFlag(false);
        setLoading(false);
      } else {
        setLoading(false);
        toast.error("Invalid Parameters");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleSell = async () => {
    try {
      if (
        userInfo.userId &&
        runeId &&
        sellRuneAmount &&
        slippage &&
        estimatePrice
      ) {
        setLoading(true);
        const message = `You will sell ${sellRuneAmount} rune (ID: ${runeId}) and will get ${estimatePrice} BTC`;
        const currentWindow: any = window;
        const signature = await currentWindow?.unisat?.signMessage(message);
        const res = await pumpSellFunc(
          userInfo.userId,
          runeId,
          sellRuneAmount,
          estimatePrice,
          slippage,
          {
            signature,
            message,
          }
        );
        setLoading(false);
        toast.success(res.msg);
        initialize();
        setSellFlag(false);
        setLoading(false);
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setSellFlag(false);
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const initialize = async () => {
    try {
      setLoading(false);

      const pActions = await getPumpActionFunc(runeId);
      setPumpActions(pActions.pumpAction);

      const runeIf: any = await getRuneInfoFunc(runeId);
      const rune = { ...runeIf?.runeInfo[0] };
      const progress =
        ((rune.runeAmount - rune.remainAmount) / rune.runeAmount) * 100;

      setProcess(progress);
      setRuneInfo(rune);
      setCoin({
        ...coin,
        name: rune.runeName
      })
      const runes = runeIf?.runeInfo;
      let uList: any[] = [];
      for (let i = 0; i < runes.length; i++) {
        try {
          let userInfo = runes[i].runebalance.userInfo[0];
          uList.push({
            balance: runes[i].runebalance.balance,
            ...userInfo,
          });
        } catch (error) {}
      }
      setUserList(uList);
    } catch (error) {
      console.log("error :>> ", error);
    }
  };

  useEffect(() => {
    initialize();
  }, [runeId]);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, [userInfo]);

  // Get Estimate Price if you are in buying

  // Get Buy Price Every 3 seconds
  useEffect(() => {
    if (socket) {
      const id = setInterval(() => {
        if (buyFlag) {
          socket.current.emit("lemme-know-buy-price", {
            runeId,
            buyRuneAmount,
          });
        }
      }, 3000);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line
  }, [socket, buyFlag, runeId, buyRuneAmount]);

  // Get Sell Price Every 3 seconds
  useEffect(() => {
    if (socket) {
      const id = setInterval(() => {
        if (sellFlag) {
          socket.current.emit("lemme-know-sell-price", {
            runeId,
            sellRuneAmount,
          });
        }
      }, 3000);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line
  }, [socket, sellFlag, runeId, sellRuneAmount]);

  useEffect(() => {
    if (socket) {
      socket.current.on("buy-price", (data: any) => {
        setEstimatePrice(data.estimatePrice || 0);
      });
      socket.current.on("sell-price", (data: any) => {
        setEstimatePrice(data.estimatePrice || 0);
      });
      return () => {
        socket.current.off("buy-price");
        socket.current.off("sell-price");
      };
    }
  }, [socket]);

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <Link className="p-3 border rounded-xl" href={"/"}>
            Go Back
          </Link>
        </div>
        <div className="gap-3 grid grid-cols-3 p-5">
          <div className="flex flex-col gap-5 col-span-2">
            {/* <TradingChart param={coin}></TradingChart> */}
            <div>Trading View</div>
            <div>
              {/* Transaction History */}
              <Tabs aria-label="Options" color="primary">
                <Tab key="thread" title="Thread">
                  <Card>
                    <CardBody>
                      <div>Thread</div>
                    </CardBody>
                  </Card>
                </Tab>
                <Tab key="trades" title="Trades">
                  <Card>
                    <CardBody>
                      <div>
                        <div>Transaction History</div>
                        <div className="flex items-center">
                          <div className="w-10">No</div>
                          <div className="gap-3 grid grid-cols-5 w-full">
                            <div>Type</div>
                            <div>Symbol</div>
                            <div>Rune</div>
                            <div>BTC</div>
                            <div>Date</div>
                          </div>
                        </div>
                        {pumpActions.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-10">{index + 1}</div>
                            <div className="gap-3 grid grid-cols-5 w-full">
                              <div>{item.type == 0 ? "Buy" : "Sell"}</div>
                              <div>{item.runeSymbol}</div>
                              <div>{item.runeAmount}</div>
                              <div>
                                {(item.btcAmount / SATS_MULTIPLE).toFixed(12)}
                              </div>
                              <div>{getTimeDifference(item.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Tab>
              </Tabs>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Tabs aria-label="Options" color="primary">
              <Tab key="buy" title="Buy">
                <Card>
                  <CardBody className="flex flex-col gap-3">
                    {/* Buy */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Buy</div>
                      <div className="flex flex-col gap-3">
                        {/* <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setRuneId(e.target.value);
                          }}
                        /> */}
                        <Input
                          type="text"
                          label="Buy Rune Amount"
                          value={buyRuneAmount}
                          disabled={loading}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setBuyRuneAmount(e.target.value);
                          }}
                        />
                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          disabled={loading}
                          min={0}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {buyFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>{`You should pay ${
                              estimatePrice / SATS_MULTIPLE
                            } btc`}</div>
                            <Button
                              color="success"
                              onClick={() => handleBuy()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            color="success"
                            onClick={() => handlePreBuy()}
                            isLoading={loading}
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="sell" title="Sell">
                <Card>
                  <CardBody className="flex gap-3">
                    {/* Sell */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Sell</div>
                      <div className="flex flex-col gap-3">
                        {/* <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => {
                            setSellFlag(false);
                            setRuneId(e.target.value);
                          }}
                        /> */}
                        <Input
                          type="text"
                          label="Sell Rune Amount"
                          value={sellRuneAmount}
                          disabled={loading}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSellRuneAmount(e.target.value);
                          }}
                        />
                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          disabled={loading}
                          min={0}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {sellFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>{`You would get ${
                              estimatePrice / SATS_MULTIPLE
                            } btc`}</div>
                            <Button
                              color="danger"
                              onClick={() => handleSell()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            color="danger"
                            onClick={() => handlePreSell()}
                            isLoading={loading}
                          >
                            Sell
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
            <div className="flex justify-between">
              <div>Your balance</div>
              <div>{123}</div>
            </div>
            <div className="flex justify-start gap-5">
              <Link href={runeInfo?.twitter || "#"} target="_blank">
                {`[twitter]`}
              </Link>
              <Link href={runeInfo?.telegram || "#"} target="_blank">
                {`[telegram]`}
              </Link>
              <Link href={runeInfo?.website || "#"} target="_blank">
                {`[website]`}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center gap-2">
                <span>Rune ID</span>
                <span>{runeInfo?.runeId}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Symbol</span>
                <span>{runeInfo?.runeSymbol}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Name</span>
                <span>{runeInfo?.runeName}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Description</span>
                <span>{runeInfo?.runeDescription}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Remain Amount</span>
                <span>{runeInfo?.remainAmount}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Price</span>
                <span>{`${runeInfo?.pool / runeInfo?.remainAmount} sats`}</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <span>{`bonding curve progress: ${process}%`}</span>
                <Progress size="md" aria-label="Loading..." value={process} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center font-bold text-xl">
                <div>Holder distribution</div>
                <div>{userList.length}</div>
              </div>
              <div>
                <div className="flex justify-between">
                  <div>Bonding Curve</div>
                  <div>
                    {`${displayPercentage(
                      runeInfo.remainAmount,
                      runeInfo.runeAmount
                    )}%`}
                  </div>
                </div>
                {userList.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <Link
                      className="font-bold underline"
                      target="_blink"
                      href={`https://mempool.space/testnet/address/${item.ordinalAddress}`}
                    >
                      {displayAddress(item.ordinalAddress)}
                    </Link>
                    <div>
                      {`${displayPercentage(
                        item.balance,
                        runeInfo.runeAmount
                      )}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}