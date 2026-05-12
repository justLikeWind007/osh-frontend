/**
 * 开源项目 API
 * 后端 baseURL: /pc/openproject
 */
import { fetchConfig } from '~/composables/useHttp'

const BASE = fetchConfig.baseURL.replace(/\/pc$/, '') + '/pc/openproject'

const getHeaders = () => {
  let token = ''
  if (process.client) {
    token = localStorage.getItem('token') || localStorage.getItem('Token') || ''
    if (!token) {
      try { token = useCookie('token').value || '' } catch {}
    }
  }
  return {
    token,
    appid: fetchConfig.headers.appid,
  }
}

const opFetch = (url, options = {}) =>
  $fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) } })

/** 分页查询开源项目列表（匿名） */
export const apiGetOpenProjectList = (params) =>
  opFetch(`${BASE}/list`, { method: 'POST', body: params })

/** 查询所有标签（匿名） */
export const apiGetOpenProjectTags = () =>
  opFetch(`${BASE}/tags`)

/** 增加点击次数（匿名） */
export const apiClickOpenProject = (id) =>
  opFetch(`${BASE}/click`, { method: 'PUT', params: { id } })

/** 查询项目详情 */
export const apiGetOpenProjectDetail = (id) =>
  opFetch(`${BASE}/detail/${id}`)

/** 收藏项目 */
export const apiFavoriteOpenProject = (projectId) =>
  opFetch(`${BASE}/favorite`, { method: 'POST', params: { projectId } })

/** 取消收藏 */
export const apiCancelFavoriteOpenProject = (projectId) =>
  opFetch(`${BASE}/favorite/cancel`, { method: 'POST', params: { projectId } })

/**
 * 排行榜
 * @param rankType star / fork
 * @param period   7 / 30
 * @param topN     默认 10
 */
export const apiGetOpenProjectRank = (rankType = 'star', period = 7, topN = 10) =>
  opFetch(`${BASE}/rank`, { params: { rankType, period, topN } })

/** 提交开源项目（需登录） */
export const apiSubmitOpenProject = (data) =>
  opFetch(`${BASE}/submit`, { method: 'POST', body: data })

/** 查询待审核列表（需 os:audit 权限） */
export const apiGetPendingOpenProjects = (params) =>
  opFetch(`${BASE}/pending`, { method: 'POST', body: params })

/** 审核开源项目（需 os:audit 权限） */
export const apiAuditOpenProject = (data) =>
  opFetch(`${BASE}/audit`, { method: 'POST', body: data })
