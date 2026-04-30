const TXID_REGEX = /^[0-9a-fA-F]{64}$/;

export function isValidTxid(value: unknown): value is string {
  return typeof value === "string" && TXID_REGEX.test(value);
}

export function assertTxid(value: unknown, walletName: string): string {
  if (!isValidTxid(value)) {
    throw new Error(
      `${walletName} did not return a valid Bitcoin transaction id ` +
        `(expected 64-char hex). The wallet likely returned a signed PSBT ` +
        `instead of broadcasting. Got: ${
          typeof value === "string"
            ? `"${value.slice(0, 32)}..."`
            : typeof value
        }`
    );
  }
  return value;
}
