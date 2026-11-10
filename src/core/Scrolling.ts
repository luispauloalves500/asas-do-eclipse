/** Repeating tile centers are symmetric around the camera, never biased upstream. */
export function tileOffset(
  index: number,
  scroll: number,
  size = 56,
  count = 2,
) {
  const cycle = size * count;
  return (
    ((((index * size - scroll + cycle / 2) % cycle) + cycle) % cycle) -
    cycle / 2
  );
}
