import JSBI from 'jsbi'
import { NO_BREAK_SPACE } from './characters'

/**
 * Formats an integer based on a limited range.
 *
 * Example:
 *   formatIntegerRange(234, 0, 99, '+') === "99+"
 *
 * @param {number} value     The number to format.
 * @param {number} min       Range minimum.
 * @param {number} max       Range maximum.
 * @param {number} maxSuffix Suffix to add if the value exceeds the max.
 */
export function formatIntegerRange(
  value = -1,
  min = 0,
  max = 99,
  maxSuffix = ''
) {
  value = parseInt(value, 10)
  if (value <= min) {
    return `${parseInt(min, 10)}`
  }
  if (value > max) {
    return `${parseInt(max, 10)}${maxSuffix}`
  }
  return String(value)
}

/**
 * Formats a number for display purposes.
 *
 * This function is not using Intl.NumberFormat() to be compatible with big
 * integers expressed as string, or BigInt-like objects.
 *
 * @param {BigInt|string|number} number Number to convert
 * @returns {string}
 */
export function formatNumber(number) {
  const numAsString = String(number)
  const [integer, decimals] = numAsString.split('.')

  return [...integer].reduceRight(
    (result, digit, index, { length }) => {
      const position = length - index - 1
      if (position > 0 && position % 3 === 0) {
        result = ',' + result
      }
      return digit + result
    },
    decimals ? `.${decimals}` : ''
  )
}

/**
 * Divide and round two big integers.
 *
 * @param {BigInt|string|number} dividend Integer to be divided + rounded
 * @param {BigInt|string|number} divisor  Divisor
 * @returns {string}
 */
function divideRoundBigInt(dividend, diviser) {
  dividend = JSBI.BigInt(dividend)
  diviser = JSBI.BigInt(diviser)
  return JSBI.divide(
    JSBI.add(dividend, JSBI.divide(diviser, JSBI.BigInt(2))),
    diviser
  )
}

/**
 * Formats a token amount for display purposes.
 *
 * @param {BigInt|string|number} amount              Number to round
 * @param {BigInt|string|number} decimals            Decimal placement for amount
 * @param {BigInt|string|number} roundToDecimals     Rounds the number to a given decimal place
 * @param {boolean}              options.displaySign Decides if the sign should be displayed
 * @param {string}               options.symbol      Symbol for the token amount
 * @returns {string}
 */
export function formatTokenAmount(
  amount,
  decimals = 18,
  roundToDecimals = 2,
  { symbol = '', displaySign = false } = {}
) {
  amount = JSBI.BigInt(String(amount))
  decimals = JSBI.BigInt(String(decimals))
  roundToDecimals = JSBI.BigInt(String(roundToDecimals))

  const _0 = JSBI.BigInt(0)
  const _10 = JSBI.BigInt(10)
  const negative = JSBI.lessThan(amount, _0)

  if (negative) {
    amount = JSBI.unaryMinus(amount)
  }

  const amountConverted = divideRoundBigInt(
    amount,
    JSBI.exponentiate(_10, JSBI.subtract(decimals, roundToDecimals))
  )

  const leftPart = formatNumber(
    JSBI.divide(amountConverted, JSBI.exponentiate(_10, roundToDecimals))
  )

  const rightPart = String(
    JSBI.remainder(amountConverted, JSBI.exponentiate(_10, roundToDecimals))
  )

  return [
    displaySign ? (negative ? '-' : '+') : '',
    leftPart,
    rightPart && rightPart !== '0' ? `.${rightPart}` : '',
    symbol ? `${NO_BREAK_SPACE}${symbol}` : '',
  ].join('')
}
