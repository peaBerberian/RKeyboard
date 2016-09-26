/**
 * Returns only unique values from an array.
 * @example uniq([1, 2, 1]) => [1, 2]
 * @example uniq([9, 2, 3, 4, 3, 5]) => [9, 2, 3, 4, 5]
 * @param {Array} x
 * @returns {Array}
 */
export default (x) => [...new Set(x)];
