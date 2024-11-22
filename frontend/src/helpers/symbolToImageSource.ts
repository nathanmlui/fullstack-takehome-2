// takes in a string symbol eg "ETH-PERP" and returns the corresponding path to its icon in /public

export default function symbolToImageSource(symbol: string | undefined) {
  const symbolsToIcons: { [key: string]: string } = {
    eth: "/eth-icon.svg",
    btc: "/btc-icon.svg",
    // Haven't downloaded/imported these icons yet
    // "SOL-PERP": "/sol-icon.svg",
    // "SRM-PERP": "/srm-icon.svg",
    // "FTT-PERP": "/ftt-icon.svg",
    // "LINK-PERP": "/link-icon.svg",
    // "YFI-PERP": "/yfi-icon.svg",
    // "XRP-PERP": "/xrp-icon.svg",
    // "LTC-PERP": "/ltc-icon.svg",
    // "DOGE-PERP": "/doge-icon.svg",
  };

  return symbol
    ? symbolsToIcons[symbol.slice(0, 3).toLocaleLowerCase()] || "/eth-icon.svg"
    : "/eth-icon.svg";
}
