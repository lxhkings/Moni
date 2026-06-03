import { describe, it, expect } from 'vitest'
import { yuanToCents, centsToYuan, formatYuan } from '../src/money.js'

describe('money', () => {
  it('yuanToCents 把元字符串转成分整数', () => {
    expect(yuanToCents('12.34')).toBe(1234)
    expect(yuanToCents('100')).toBe(10000)
    expect(yuanToCents('0.5')).toBe(50)
    expect(yuanToCents('0.05')).toBe(5)
  })

  it('yuanToCents 四舍五入到分', () => {
    expect(yuanToCents('1.006')).toBe(101)
    expect(yuanToCents('1.004')).toBe(100)
  })

  it('centsToYuan 把分转成两位小数元字符串', () => {
    expect(centsToYuan(1234)).toBe('12.34')
    expect(centsToYuan(5)).toBe('0.05')
    expect(centsToYuan(0)).toBe('0.00')
  })

  it('formatYuan 带货币符号', () => {
    expect(formatYuan(1234, '¥')).toBe('¥12.34')
  })
})