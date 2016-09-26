/**
 * Returns true if the variable given is not null nor undefined.
 * @example isSet(false) => true
 * @example isSet(0) => true
 * @example isSet(null) => false
 * @example isSet('toto') => true
 * @example isSet(undefined) => false
 * @param {*} x
 * @returns {Boolean}
 */
export default (x) => x != null;
