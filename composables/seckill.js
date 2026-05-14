// composables/seckill.js — 秒杀模块 API
// 对齐后端接口文档

// ── 商品池管理 ────────────────────────────────────────────────

// 1-1 查询商品池列表
// GET /pc/seckill/goods/list
// query: { goodsName, goodsType, status, pageNum, pageSize }
export function useSeckillGoodsListApi(query = {}) {
  return useHttpGet('SeckillGoodsList', '/seckill/goods/list', {
    query,
    lazy: true,
  })
}

// 1-2 查询商品池详情
// GET /pc/seckill/goods/detail/{id}
export function useSeckillGoodsDetailApi(id) {
  return useHttpGet('SeckillGoodsDetail', `/seckill/goods/detail/${id}`, {
    $: true,
  })
}

// 1-3 添加商品到商品池
// POST /pc/seckill/goods/add
export function useSeckillGoodsAddApi(body) {
  return useHttpPost('SeckillGoodsAdd', '/seckill/goods/add', {
    $: true,
    body,
  })
}

// 1-4 修改商品信息
// POST /pc/seckill/goods/update
export function useSeckillGoodsUpdateApi(body) {
  return useHttpPost('SeckillGoodsUpdate', '/seckill/goods/update', {
    $: true,
    body,
  })
}

// 1-5 批量上架/下架商品
// POST /pc/seckill/goods/status
// body: { ids: [1,2], status: 1(上架) | 2(下架) }
export function useSeckillGoodsStatusApi(ids, status) {
  return useHttpPost('SeckillGoodsStatus', '/seckill/goods/status', {
    $: true,
    body: { ids: Array.isArray(ids) ? ids : [ids], status },
  })
}

// 1-6 批量删除商品
// DELETE /pc/seckill/goods/batch?ids=1&ids=2
export function useSeckillGoodsDeleteApi(ids) {
  const idArray = Array.isArray(ids) ? ids : [ids]
  const params = idArray.map(id => `ids=${id}`).join('&')
  return useHttp('SeckillGoodsDelete', `/seckill/goods/batch?${params}`, {
    $: true,
    method: 'DELETE',
  })
}

// ── 活动管理（管理端） ────────────────────────────────────────

// 2-1 创建秒杀活动
// POST /pc/seckill/activity/add
export function useSeckillActivityAddApi(body) {
  return useHttpPost('SeckillActivityAdd', '/seckill/activity/add', {
    $: true,
    body,
  })
}

// 2-2 查询活动列表（管理端）
// GET /pc/seckill/activity/list
// query: { title, status, pageNum, pageSize }
// 响应: { code, rows, total }（rows 在顶层）
export function useSeckillActivityListApi(query = {}) {
  return useHttpGet('SeckillActivityList', '/seckill/activity/list', {
    query,
    lazy: true,
  })
}
// 2-3 查询活动详情（管理端）
// GET /pc/seckill/activity/detail/{id}
export function useSeckillActivityDetailApi(id) {
  return useHttpGet('SeckillActivityDetail', `/seckill/activity/detail/${id}`, {
    $: true,
  })
}

// 2-4 修改活动（仅草稿 status=0 可修改）
// POST /pc/seckill/activity/update
export function useSeckillActivityUpdateApi(body) {
  return useHttpPost('SeckillActivityUpdate', '/seckill/activity/update', {
    $: true,
    body,
  })
}

// 2-5 发布/下架活动
// POST /pc/seckill/activity/status
// body: { ids: [9], status: 1(发布) | 4(下架) }
export function useSeckillActivityStatusApi(ids, status) {
  return useHttpPost('SeckillActivityStatus', '/seckill/activity/status', {
    $: true,
    body: { ids: Array.isArray(ids) ? ids : [ids], status },
  })
}

// 2-6 批量删除活动
// DELETE /pc/seckill/activity/batch?ids=1&ids=2
export function useSeckillActivityDeleteApi(ids) {
  const idArray = Array.isArray(ids) ? ids : [ids]
  const params = idArray.map(id => `ids=${id}`).join('&')
  return useHttp('SeckillActivityDelete', `/seckill/activity/batch?${params}`, {
    $: true,
    method: 'DELETE',
  })
}

// 2-7 查询秒杀订单列表（管理端）
// GET /pc/seckill/order/list
export async function fetchSeckillOrderList(query = {}) {
  const baseURL = process.client
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8081/pc'
        : 'http://43.242.200.25:8081/pc')
    : 'http://localhost:8081/pc'

  const token = (() => {
    let t = ''
    if (process.client) {
      const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
      t = match ? decodeURIComponent(match[1]) : ''
      if (!t) t = localStorage.getItem('token') || ''
    }
    return t
  })()
  const headers = { appid: 'bd9d01ecc75dbbaaefce' }
  if (token) { headers.token = token; headers.Authorization = `Bearer ${token}` }

  return $fetch('/seckill/order/list', {
    baseURL, headers, method: 'GET', query,
  }).catch(() => ({ rows: [], total: 0 }))
}

// 3-1 查询进行中的活动列表（用户端）
// GET /pc/seckill/user/activity/list
// 响应: { code, rows, total }（rows 在顶层）
export function useSeckillUserActivityListApi(query = {}) {
  return useHttpGet('SeckillUserActivityList', '/seckill/user/activity/list', {
    query,
    lazy: true,
  })
}

// 复用 useHttp.js 的 token 取法：cookie 优先，localStorage 兜底
function resolveTokenForFetch() {
  let token = ''
  if (process.client) {
    // 从 document.cookie 直接解析，避免 useCookie 在异步上下文中失效
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
    token = match ? decodeURIComponent(match[1]) : ''
    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('Token') || ''
    }
  } else {
    try { token = useCookie('token').value || '' } catch {}
  }
  return token
}

// 3-1b 同上，但用 $fetch 直接返回完整响应（供需要 rows 的场景使用）
export async function fetchSeckillActivityRows(query = {}) {
  const baseURL = process.client
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8081/pc'
        : 'http://43.242.200.25:8081/pc')
    : 'http://localhost:8081/pc'

  const token = resolveTokenForFetch()
  const headers = { appid: 'bd9d01ecc75dbbaaefce' }
  if (token) { headers.token = token; headers.Authorization = `Bearer ${token}` }

  return $fetch('/seckill/user/activity/list', {
    baseURL, headers, method: 'GET', query,
  }).catch(() => ({ rows: [], total: 0 }))
}

// 管理端活动列表：优先调管理端接口（返回所有状态），失败则降级到用户端接口
export async function fetchSeckillAdminActivityRows(query = {}) {
  const baseURL = process.client
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8081/pc'
        : 'http://43.242.200.25:8081/pc')
    : 'http://localhost:8081/pc'

  const token = resolveTokenForFetch()
  const headers = { appid: 'bd9d01ecc75dbbaaefce' }
  if (token) { headers.token = token; headers.Authorization = `Bearer ${token}` }

  const adminRes = await $fetch('/seckill/activity/list', {
    baseURL, headers, method: 'GET', query,
  }).catch(() => null)

  // 管理端接口成功且有权限
  if (adminRes?.code === 200) return adminRes

  // 降级：用户端接口（只返回进行中的活动）
  return $fetch('/seckill/user/activity/list', {
    baseURL, headers, method: 'GET', query,
  }).catch(() => ({ rows: [], total: 0 }))
}

// 3-2 查询活动详情（用户端，只返回进行中的活动）
// GET /pc/seckill/user/activity/detail/{id}
export function useSeckillUserActivityDetailApi(id) {
  return useHttpGet('SeckillUserActivityDetail', `/seckill/user/activity/detail/${id}`, {
    $: true,
  })
}

// 3-3 执行秒杀（核心接口）
// POST /pc/seckill/user/do/{activityId}/{itemId}?userId=xxx
// 返回: { seckillNo, status, goodsId, goodsType, seckillPrice, payExpireTime, ... }
export function useSeckillDoApi(activityId, itemId) {
  return useHttpPost('SeckillDo', `/seckill/user/do/${activityId}/${itemId}`, {
    $: true,
  })
}

// 3-4 查询秒杀结果（前端轮询）
// GET /pc/seckill/user/order/result/{activityId}/{itemId}
// 返回: { seckillNo, status: -1(处理中) | 0(待支付), payExpireTime }
export function useSeckillOrderResultApi(activityId, itemId) {
  return useHttpGet('SeckillOrderResult', `/seckill/user/order/result/${activityId}/${itemId}`, {
    $: true,
  })
}

// 3-5 取消秒杀订单
// POST /pc/seckill/user/order/cancel/{seckillNo}
export function useSeckillOrderCancelApi(seckillNo) {
  return useHttpPost('SeckillOrderCancel', `/seckill/user/order/cancel/${seckillNo}`, {
    $: true,
  })
}

// 3-6 发起秒杀支付
// POST /pc/seckill/user/order/pay/{seckillNo}
// 返回: { code: 1, payurl, qrcode, trade_no, out_trade_no }
export function useSeckillPayApi(seckillNo) {
  return useHttpPost('SeckillPay', `/seckill/user/order/pay/${seckillNo}`, {
    $: true,
  })
}

// 3-7 查询秒杀订单支付状态（前端轮询）
// GET /pc/seckill/user/order/status/{seckillNo}
// status: 0=待支付(继续轮询) 1=已支付(跳转已购) 2=已取消 3=已超时 fail=不存在
export function useSeckillOrderStatusApi(seckillNo) {
  return useHttpGet('SeckillOrderStatus', `/seckill/user/order/status/${seckillNo}`, {
    $: true,
  })
}
