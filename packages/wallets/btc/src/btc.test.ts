import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BaseFeatures,
  NotSupported,
} from "@wormhole-labs/wallet-aggregator-core";
import { LeatherBtc } from "./leather";
import { OKXBtc } from "./okx";
import { PhantomBtc } from "./phantom";
import { assertTxid, isValidTxid } from "./txid";
import { UnisatBtc } from "./unisat";
import { XverseBtc } from "./xverse";

const VALID_TXID =
  "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const SIGNED_PSBT_HEX =
  "70736274ff01005e02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000100e1f5050000000016001400000000000000000000000000000000000000000000000000";
const SIGNED_PSBT_BASE64 =
  "cHNidP8BAJoCAAAAAjrdyL3VEm9w8PwdvHcQ1RcwLqSqW6FvBfHHTCuZyFwAAAAAAA==";

const restoreWindow = () => {
  // bun test runs in a node-like env; reset window between cases
  delete (globalThis as any).window;
};

describe("assertTxid / isValidTxid", () => {
  test("accepts a valid 64-char hex txid", () => {
    expect(isValidTxid(VALID_TXID)).toBe(true);
    expect(assertTxid(VALID_TXID, "test")).toBe(VALID_TXID);
  });

  test("rejects a signed PSBT hex string", () => {
    expect(isValidTxid(SIGNED_PSBT_HEX)).toBe(false);
    expect(() => assertTxid(SIGNED_PSBT_HEX, "test")).toThrow(
      /did not return a valid Bitcoin transaction id/
    );
  });

  test("rejects a base64 PSBT", () => {
    expect(isValidTxid(SIGNED_PSBT_BASE64)).toBe(false);
    expect(() => assertTxid(SIGNED_PSBT_BASE64, "test")).toThrow();
  });

  test("rejects undefined / null / non-string", () => {
    expect(isValidTxid(undefined)).toBe(false);
    expect(isValidTxid(null)).toBe(false);
    expect(isValidTxid(123)).toBe(false);
    expect(isValidTxid({ txid: VALID_TXID })).toBe(false);
    expect(() => assertTxid(undefined, "test")).toThrow();
  });

  test("rejects shorter / longer hex strings", () => {
    expect(isValidTxid("abc123")).toBe(false);
    expect(isValidTxid(VALID_TXID + "00")).toBe(false);
    expect(isValidTxid(VALID_TXID.slice(0, 63))).toBe(false);
  });

  test("rejects non-hex characters", () => {
    const nonHex = "z".repeat(64);
    expect(isValidTxid(nonHex)).toBe(false);
  });
});

describe("XverseBtc.signAndSendTransaction", () => {
  beforeEach(restoreWindow);
  afterEach(restoreWindow);

  test("returns the txid from a broadcast response", async () => {
    const request = mock(async () => ({
      result: { txid: VALID_TXID, psbt: SIGNED_PSBT_BASE64 },
    }));
    (globalThis as any).window = { BitcoinProvider: { request } };

    const wallet = new XverseBtc();
    const result = await wallet.signAndSendTransaction(SIGNED_PSBT_BASE64);

    expect(result.id).toBe(VALID_TXID);
    expect(request).toHaveBeenCalledWith("signPsbt", {
      psbt: SIGNED_PSBT_BASE64,
      broadcast: true,
    });
  });

  test("throws if the wallet returns a PSBT instead of a txid", async () => {
    const request = mock(async () => ({
      // No txid in result — wallet returned only the signed PSBT.
      result: { psbt: SIGNED_PSBT_BASE64 },
    }));
    (globalThis as any).window = { BitcoinProvider: { request } };

    const wallet = new XverseBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_BASE64)
    ).rejects.toThrow(/Xverse did not return a valid Bitcoin transaction id/);
  });

  test("propagates JSON-RPC errors", async () => {
    const request = mock(async () => ({
      error: { code: -1, message: "User rejected" },
    }));
    (globalThis as any).window = { BitcoinProvider: { request } };

    const wallet = new XverseBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_BASE64)
    ).rejects.toThrow(/Xverse signPsbt failed/);
  });
});

describe("UnisatBtc.signAndSendTransaction", () => {
  beforeEach(restoreWindow);
  afterEach(restoreWindow);

  test("signs then pushes and returns the broadcast txid", async () => {
    const signPsbt = mock(async () => SIGNED_PSBT_HEX);
    const pushPsbt = mock(async () => VALID_TXID);
    (globalThis as any).window = {
      unisat: { requestAccounts: mock(async () => []), signPsbt, pushPsbt },
    };

    const wallet = new UnisatBtc();
    const result = await wallet.signAndSendTransaction(SIGNED_PSBT_HEX);

    expect(signPsbt).toHaveBeenCalledWith(SIGNED_PSBT_HEX, {
      autoFinalized: true,
    });
    expect(pushPsbt).toHaveBeenCalledWith(SIGNED_PSBT_HEX);
    expect(result.id).toBe(VALID_TXID);
  });

  test("throws if pushPsbt returns a PSBT instead of a txid", async () => {
    // Regression guard: prior implementation returned signPsbt's output as
    // the txid, which is actually a signed PSBT hex string.
    const signPsbt = mock(async () => SIGNED_PSBT_HEX);
    const pushPsbt = mock(async () => SIGNED_PSBT_HEX);
    (globalThis as any).window = {
      unisat: { requestAccounts: mock(async () => []), signPsbt, pushPsbt },
    };

    const wallet = new UnisatBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_HEX)
    ).rejects.toThrow(/Unisat did not return a valid Bitcoin transaction id/);
  });
});

describe("PhantomBtc.signAndSendTransaction", () => {
  beforeEach(restoreWindow);
  afterEach(restoreWindow);

  test("does not advertise SignAndSendTransaction (no broadcast API)", () => {
    const wallet = new PhantomBtc();
    expect(wallet.getFeatures()).not.toContain(
      BaseFeatures.SignAndSendTransaction
    );
  });

  test("throws NotSupported when called", async () => {
    (globalThis as any).window = {
      phantom: {
        bitcoin: {
          requestAccounts: mock(async () => []),
          signPSBT: mock(async () => SIGNED_PSBT_HEX),
        },
      },
    };

    const wallet = new PhantomBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_HEX)
    ).rejects.toBeInstanceOf(NotSupported);
  });
});

describe("LeatherBtc.signAndSendTransaction", () => {
  beforeEach(restoreWindow);
  afterEach(restoreWindow);

  test("returns the broadcast txid", async () => {
    const request = mock(async () => ({
      result: { txid: VALID_TXID, hex: SIGNED_PSBT_HEX },
    }));
    (globalThis as any).window = { LeatherProvider: { request } };

    const wallet = new LeatherBtc();
    const result = await wallet.signAndSendTransaction(SIGNED_PSBT_HEX);

    expect(request).toHaveBeenCalledWith("signPsbt", {
      hex: SIGNED_PSBT_HEX,
      broadcast: true,
    });
    expect(result.id).toBe(VALID_TXID);
  });

  test("throws if wallet only returns signed hex without a txid", async () => {
    const request = mock(async () => ({
      result: { hex: SIGNED_PSBT_HEX },
    }));
    (globalThis as any).window = { LeatherProvider: { request } };

    const wallet = new LeatherBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_HEX)
    ).rejects.toThrow(/Leather did not return a valid Bitcoin transaction id/);
  });
});

describe("OKXBtc.signAndSendTransaction", () => {
  beforeEach(restoreWindow);
  afterEach(restoreWindow);

  test("signs then pushes and returns the broadcast txid", async () => {
    const signPsbt = mock(async () => SIGNED_PSBT_HEX);
    const pushPsbt = mock(async () => VALID_TXID);
    (globalThis as any).window = {
      okxwallet: {
        bitcoin: {
          requestAccounts: mock(async () => []),
          signPsbt,
          pushPsbt,
        },
      },
    };

    const wallet = new OKXBtc();
    const result = await wallet.signAndSendTransaction(SIGNED_PSBT_HEX);

    expect(signPsbt).toHaveBeenCalledWith(SIGNED_PSBT_HEX, {
      autoFinalized: true,
    });
    expect(pushPsbt).toHaveBeenCalledWith(SIGNED_PSBT_HEX);
    expect(result.id).toBe(VALID_TXID);
  });

  test("throws when pushPsbt returns a PSBT instead of a txid", async () => {
    const signPsbt = mock(async () => SIGNED_PSBT_HEX);
    const pushPsbt = mock(async () => SIGNED_PSBT_HEX);
    (globalThis as any).window = {
      okxwallet: {
        bitcoin: {
          requestAccounts: mock(async () => []),
          signPsbt,
          pushPsbt,
        },
      },
    };

    const wallet = new OKXBtc();
    await expect(
      wallet.signAndSendTransaction(SIGNED_PSBT_HEX)
    ).rejects.toThrow(/OKX did not return a valid Bitcoin transaction id/);
  });
});
