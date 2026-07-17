export function calculateEan13CheckDigit(value: string) {
  const sum = value
    .split("")
    .reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );
  return String((10 - (sum % 10)) % 10);
}

export function createEan13() {
  const randomDigits = new Uint8Array(9);
  globalThis.crypto.getRandomValues(randomDigits);
  const value = `880${Array.from(randomDigits, (digit) => digit % 10).join("")}`;
  return `${value}${calculateEan13CheckDigit(value)}`;
}
