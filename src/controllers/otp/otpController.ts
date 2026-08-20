export function generateNewOTP(otpLength: number) {
  return Math.floor(
    1 * Math.pow(10, otpLength - 1) +
      Math.random() * 9 * Math.pow(10, otpLength - 1),
  );
}
