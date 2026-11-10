/** Gameplay never stretches or crops the logical 16×28 combat field. */
export function viewport(width: number, height: number) {
  const scale = Math.min(width / 16, height / 28);
  return {
    scale,
    fieldWidth: 16 * scale,
    fieldHeight: 28 * scale,
    worldWidth: width / scale,
    worldHeight: height / scale,
  };
}
