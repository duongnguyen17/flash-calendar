/**
 * Returns a list of numbers from `start` (inclusive) to `stop`
 * (inclusive). In mathematical terms, `range(a, b)` is equivalent to
 * the interval `[a, b]`.
 *
 * An optional `step` can be provided to control the size of the increemnt (defaults to `1`).
 *
 * Copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
 */
export const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

export const abbreviateFare = (fare: number | undefined | null) => {
  if (!fare) {
    return "--";
  }

  const billion = fare / 1_000_000_000;
  if (billion >= 1) {
    return Number(billion.toFixed(1)) + "t";
  }

  const millions = fare / 1_000_000;
  if (millions >= 1) {
    return Number(millions.toFixed(1)) + "tr";
  }

  const k = fare / 1_000;
  return Math.round(k) + "k";
};
