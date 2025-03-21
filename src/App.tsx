import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const projects = [
  {
    name: 'Auto Clippers'
  }
]


const MIN_PRICE_PER_CLIP = 0.01
const MIN_PUBLIC_DEMAND = 1
const MIN_CLIPS_SOLD = 1
const MIN_CPS = 0
const MIN_WIRE_COST = 14
const MAX_WIRE_COST = 26

const INITIAL_MANUFACTURED_CLIPS = 0
const INITIAL_UNSOLD_CLIPS = 0
const INITIAL_AVAILABLE_FUNDS = 0
const INITIAL_PRICE_PER_CLIP = 0.25
const INITIAL_MARKETING_LEVEL = 1
const INITIAL_MARKET_SHARE = 5
const INITIAL_MARKETING_COST = 100
const INITIAL_CPS_MARK = 0
const INITIAL_CPS = MIN_CPS
const INITIAL_WIRE_INCHES = 1_000
const INITIAL_WIRE_COST = 20
const INITIAL_WIRE_PER_SPOOL = 1_000

const roundVal = (num: number, places: number) => {
  const multiplier = Math.pow(10, places)
  return Math.round(num * multiplier) / multiplier
}

type ProcessTickInput = {
  timestamp: number
  pricePerClip: number
  publicDemand: number
  unsoldPaperclips: number
  wireCost: number
}

type CreatePaperclipInput = {
  wireInches: number
}

type PurchaseMarketingInput = {
  availableFunds: number
  marketingCost: number
}

type ClipsSaleInput = {
  pricePerClip: number
  publicDemand: number
  unsoldPaperclips: number
}

type CpsMarkInput = {
  previousCpsMark: number
  intervalSeconds: number
  currentClips: number
}

type WireCostInput = {
  currentCost: number
}

type PurchaseWireInput = {
  availableFunds: number
  wireCost: number
}

function App() {
  const [manufacturedPaperclips, setManufacturedPaperclips] = useState(INITIAL_MANUFACTURED_CLIPS)
  const [unsoldPaperclips, setUnsoldPaperclips] = useState(INITIAL_UNSOLD_CLIPS)
  const [availableFunds, setAvailableFunds] = useState(INITIAL_AVAILABLE_FUNDS)
  const [pricePerClip, setPricePerClip] = useState(INITIAL_PRICE_PER_CLIP)
  const [marketingLevel, setMarketingLevel] = useState(INITIAL_MARKETING_LEVEL)
  const [marketShare, setMarketShare] = useState(INITIAL_MARKET_SHARE)
  const [marketingCost, setMarketingCost] = useState(INITIAL_MARKETING_COST)
  const [cpsMark, setCpsMark] = useState(INITIAL_CPS_MARK)
  const [cps, setCps] = useState(INITIAL_CPS)
  const [wireInches, setWireInches] = useState(INITIAL_WIRE_INCHES)
  const [wireCost, setWireCost] = useState(INITIAL_WIRE_COST)
  const [wirePerSpool, setWirePerSpool] = useState(INITIAL_WIRE_PER_SPOOL)

  const publicDemand = useMemo(() => {
    const val = Math.ceil(
      marketingLevel * marketShare / (pricePerClip / 1.5)
    )
    return val > MIN_PUBLIC_DEMAND ? val : MIN_PUBLIC_DEMAND
  }, [marketingLevel, marketShare, pricePerClip])

  const createPaperclipButtonHandler = ({ wireInches }: CreatePaperclipInput) => {
    const canCreate = wireInches > 0
    setWireInches(canCreate ? wireInches - 1 : wireInches)
    setManufacturedPaperclips(curr => canCreate ? curr + 1 : curr)
    setUnsoldPaperclips(curr => canCreate ? curr + 1 : curr)
  }

  const lowerPricePerClipButtonHandler = () => setPricePerClip(roundVal(pricePerClip - 0.01, 2) || MIN_PRICE_PER_CLIP)
  const raisePricePerClipButtonHandler = () => setPricePerClip(roundVal(pricePerClip + 0.01, 2))

  const purchaseMarketingHandler = ({ availableFunds, marketingCost }: PurchaseMarketingInput) => {
    const canPurchase = (availableFunds >= marketingCost)

    setAvailableFunds(curr => canPurchase ? curr - marketingCost : curr)
    setMarketingLevel(curr => canPurchase ? curr + 1 : curr)
    setMarketingCost(curr => canPurchase ? curr * 2 : curr)
  }

  const purchaseWireHandler = ({ availableFunds, wireCost }: PurchaseWireInput) => {
    const canPurchase = (availableFunds >= wireCost)

    setWireInches(curr => canPurchase ? curr + wirePerSpool : curr)
    setAvailableFunds(curr => canPurchase ? curr - wireCost : curr)
  }

  const processSale = ({ unsoldPaperclips, pricePerClip }: ClipsSaleInput) => {
    const clipsSold = (() => {
      if (unsoldPaperclips > 0) {
        const clipsToSell = Math.ceil(unsoldPaperclips * (10 / publicDemand))
        return clipsToSell > MIN_CLIPS_SOLD ? clipsToSell : MIN_CLIPS_SOLD
      }

      return 0
    })()

    setAvailableFunds(curr => curr + (clipsSold * pricePerClip))
    setUnsoldPaperclips(curr => curr - clipsSold)
  }

  const processCps = ({ previousCpsMark, intervalSeconds, currentClips }: CpsMarkInput) => {
    setCps((currentClips - previousCpsMark) / intervalSeconds)
    setCpsMark(currentClips)
  }

  const changeWireCost = ({ currentCost }: WireCostInput) => {
    const idx = Math.floor(Math.random() * 10)
    const delta = idx === 0
      ? 0 - Math.ceil(Math.random() * 6)
      : idx === 9
        ? Math.ceil(Math.random() * 6)
        : 0
    const cost = currentCost + delta
    console.log(currentCost, delta, cost)

    setWireCost(cost < MIN_WIRE_COST ? MIN_WIRE_COST : cost > MAX_WIRE_COST ? MAX_WIRE_COST : cost)
  }

  const processTick = ({ timestamp, unsoldPaperclips, pricePerClip, publicDemand, wireCost }: ProcessTickInput) => {
    const every1Sec = (timestamp % 1000) < 1000
    const every2Secs = (timestamp % 2000) < 1000
    const every5Secs = (timestamp % 5000) < 1000

    every1Sec && changeWireCost({ currentCost: wireCost })
    every1Sec && processCps({ previousCpsMark: cpsMark, intervalSeconds: 1, currentClips: manufacturedPaperclips })
    every2Secs && processSale({ unsoldPaperclips, pricePerClip, publicDemand })
  }

  useEffect(() => {
    const tick = setInterval(() => {
      const t = new Date().getTime()
      processTick({ timestamp: t, unsoldPaperclips, pricePerClip, publicDemand, wireCost })
    }, 1000)
    return () => clearInterval(tick)
  }, [unsoldPaperclips, pricePerClip, publicDemand, wireCost])

  return (
    <main>
      <section>
        <h2>Sporks: {manufacturedPaperclips}</h2>
        <button onClick={() => createPaperclipButtonHandler({ wireInches })} disabled={wireInches <= 0}>create spork</button>
      </section>
      <section>
        <h3>Business</h3>
        <hr />
        Available Funds: ${availableFunds.toFixed(2)}<br />
        Unsold Inventory: {unsoldPaperclips}<br />
        <section>
          <button onClick={lowerPricePerClipButtonHandler}>lower</button>
          <button onClick={raisePricePerClipButtonHandler}>raise</button>
          Price per Spork: ${pricePerClip.toFixed(2)}
        </section>
        Public Demand: {publicDemand}%
      </section>
      <br />
      <section>
        <button onClick={() => purchaseMarketingHandler({ availableFunds, marketingCost })} disabled={availableFunds < marketingCost}>marketing</button>
        Level: {marketingLevel}<br />
        Cost: ${marketingCost}
      </section>
      <section>
        <h3>Manufacturing</h3>
        <hr />
        <section>
          Clips per Second: {cps}<br />
        </section>
        <br />
        <section>
          <button onClick={() => purchaseWireHandler({ availableFunds, wireCost })} disabled={availableFunds < wireCost}>wire</button> {wireInches} inches<br />
          Cost: ${wireCost}
        </section>
      </section>
    </main>
  )
}

export default App
