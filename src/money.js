// 金额统一以「分」整数存储与计算，规避浮点误差。

export function yuanToCents(yuan) {
  const n = Number(yuan)
  if (Number.isNaN(n)) throw new Error(`非法金额: ${yuan}`)
  return Math.round(n * 100)
}

export function centsToYuan(cents) {
  return (cents / 100).toFixed(2)
}

export function formatYuan(cents, symbol = '¥') {
  return `${symbol}${centsToYuan(cents)}`
}