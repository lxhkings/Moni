import { describe, it, expect } from 'vitest'
import { splitIntoFrames, reassembleFrames } from '../src/db/qr.js'

describe('qr framing', () => {
  it('小数据切成单帧', () => {
    const frames = splitIntoFrames('hello', 100)
    expect(frames.length).toBe(1)
    expect(frames[0]).toBe('MONI/0/1/hello')
  })

  it('大数据按 chunkSize 切多帧', () => {
    const payload = 'abcdefghij' // 10 字符
    const frames = splitIntoFrames(payload, 4)
    expect(frames.length).toBe(3) // 4+4+2
    expect(frames[0]).toBe('MONI/0/3/abcd')
    expect(frames[2]).toBe('MONI/2/3/ij')
  })

  it('reassembleFrames 乱序也能还原', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const shuffled = [frames[2], frames[0], frames[1]]
    expect(reassembleFrames(shuffled)).toBe('abcdefghij')
  })

  it('reassembleFrames 缺帧返回 null', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const partial = [frames[0], frames[2]] // 缺第 1 帧
    expect(reassembleFrames(partial)).toBe(null)
  })

  it('reassembleFrames 去重重复扫到的同一帧', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const withDup = [frames[0], frames[0], frames[1], frames[2]]
    expect(reassembleFrames(withDup)).toBe('abcdefghij')
  })

  it('忽略非 MONI 前缀帧', () => {
    const frames = splitIntoFrames('hello', 100)
    expect(reassembleFrames(['random-qr', ...frames])).toBe('hello')
  })
})