import { describe, it, expect } from "vitest";
import { generateSpaydString } from "@/lib/spayd";

describe("SPAYD Generator", () => {
  it("should generate basic SPAYD string with only IBAN", () => {
    const result = generateSpaydString({ iban: "CZ1234567890" });
    expect(result).toBe("SPD*1.0*ACC:CZ1234567890*PT:IP");
  });

  it("should remove spaces from IBAN", () => {
    const result = generateSpaydString({ iban: "CZ12 3456 7890" });
    expect(result).toBe("SPD*1.0*ACC:CZ1234567890*PT:IP");
  });

  it("should format amount correctly to 2 decimal places", () => {
    const result = generateSpaydString({ iban: "CZ1234567890", amount: 150 });
    expect(result).toContain("*AM:150.00");

    const result2 = generateSpaydString({ iban: "CZ1234567890", amount: "150.5" });
    expect(result2).toContain("*AM:150.50");
  });

  it("should include all optional parameters", () => {
    const result = generateSpaydString({
      iban: "CZ0000",
      amount: 500,
      currency: "CZK",
      vs: "1234567890",
      ks: "0308",
      ss: "9876",
      msg: "Test Platba",
    });

    expect(result).toBe(
      "SPD*1.0*ACC:CZ0000*PT:IP*AM:500.00*CC:CZK*X-VS:1234567890*X-KS:0308*X-SS:9876*MSG:Test Platba",
    );
  });

  it("should return empty string if no IBAN is provided", () => {
    const result = generateSpaydString({ iban: "" });
    expect(result).toBe("");
  });
});
