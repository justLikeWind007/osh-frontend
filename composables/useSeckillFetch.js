/**
 * 秒杀模块统一 $fetch 封装
 * 解决 useHttp 在异步上下文（onMounted、事件处理器）中取不到 token 的问题
 * 直接从 document.cookie 读取 token，兼容所有调用场景
 */
export function useSeckillFetch() {
  function getToken() {
    if (!process.client) return ''
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  function getBaseURL() {
    if (!process.client) return 'http://localhost:8081/pc'
    const h = window.location.hostname
    return h === 'localhost' || h === '127.0.0.1'
      ? 'http://localhost:8081/pc'
      : 'http://43.242.200.25:8081/pc'
  }

  function seckillFetch(url, options = {}) {
    const token = getToken()
    return $fetch(url, {
      baseURL: getBaseURL(),
      headers: {
        appid: 'bd9d01ecc75dbbaaefce',
        token,
        Authorization: `Bearer ${token}`,
      },
      ...options,
    })
  }

  return { seckillFetch }
}
