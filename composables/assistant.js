import { fetchConfig } from '~/composables/useHttp'

const feedbackCategoryIconMap = {
  announcement: '📢',
  suggestion: '💡',
  lightbulb: '💡',
  bug: '🐛',
  question: '❓',
  help: '🆘',
  other: '📝',
  note: '📝',
}

const feedbackStatusTextMap = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
  submitted: '待处理',
  triaged: '处理中',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  rejected: '已关闭',
}

const assistantHeaders = () => {
  let tokenValue = ''
  try {
    tokenValue = useCookie('token').value || ''
  } catch {}

  if (process.client) {
    tokenValue = localStorage.getItem('token') || localStorage.getItem('Token') || tokenValue
  }

  const headers = {
    appid: fetchConfig.headers.appid,
  }

  if (tokenValue) {
    headers.Authorization = `Bearer ${tokenValue}`
    headers.token = tokenValue
  }

  return headers
}

const assistantFetch = (url, options = {}) => {
  return $fetch(url, {
    baseURL: fetchConfig.baseURL,
    headers: {
      ...assistantHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  })
}

export function resolveFeedbackCategoryIcon(category) {
  const iconKey = category?.icon || category?.categoryIcon || category?.code || category?.categoryCode
  return feedbackCategoryIconMap[iconKey] || category?.icon || category?.categoryIcon || '📝'
}

export function resolveFeedbackStatusText(status) {
  return feedbackStatusTextMap[status] || status || ''
}

export function resolveFeedbackErrorMessage(error, fallbackMessage = '操作失败') {
  return error?.data?.msg || error?.data?.data || error?.msg || error?.message || fallbackMessage
}

export function assertAssistantResponseSuccess(response, fallbackMessage = '操作失败') {
  if (response?.code === 200) {
    return response.data
  }
  throw new Error(response?.msg || fallbackMessage)
}

export function apiGetAssistantInit(courseId) {
  return assistantFetch('/assistant/init', {
    params: courseId ? { courseId } : {},
  })
}

export function apiAskSiteQuestion(question) {
  return assistantFetch('/assistant/site-qa/ask', {
    method: 'POST',
    body: { question },
  })
}

export function apiAskCourseQuestion(courseId, question) {
  return assistantFetch('/assistant/course-qa/ask', {
    method: 'POST',
    body: { courseId, question },
  })
}

export function apiCreateAssistantFeedback(payload) {
  return apiCreateFeedback(payload)
}

export function apiGetMyAssistantFeedback() {
  return assistantFetch('/assistant/feedback/page', {
    method: 'POST',
    body: {
      queryMode: 'mine',
      pageNum: 1,
      pageSize: 50,
    },
  })
}

// ==================== 反馈系统 - 公开接口 ====================

/**
 * 获取反馈分类列表
 */
export function apiGetFeedbackCategories() {
  return $fetch('/public/feedback/category/list', {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
  })
}

export function apiGetFeedbackTags(params = {}) {
  return $fetch('/public/feedback/tag/list', {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
    query: params,
  })
}

export function apiCreateFeedbackTag(payload) {
  return assistantFetch('/assistant/feedback/tag/create', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 分页查询反馈列表
 */
export function apiPageFeedback(params) {
  return assistantFetch('/public/feedback/page', {
    method: 'POST',
    body: params,
  })
}

/**
 * 获取反馈详情
 */
export function apiGetFeedbackDetail(id) {
  return assistantFetch(`/public/feedback/detail/${id}`)
}

/**
 * 获取反馈处理记录列表
 */
export function apiGetFeedbackProcessRecords(feedbackId) {
  return assistantFetch(`/public/feedback/${feedbackId}/process-record/list`)
}

/**
 * 获取反馈评论列表
 */
export function apiGetFeedbackComments(feedbackId, pageNum = 1, pageSize = 20) {
  return $fetch(`/public/feedback/${feedbackId}/comment/list`, {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
    params: { pageNum, pageSize },
  })
}

/**
 * 获取当前用户对反馈的互动状态
 */
export function apiGetFeedbackInteractionStatus(feedbackId) {
  return assistantFetch(`/feedback/${feedbackId}/interaction-status`)
}

// ==================== 反馈系统 - 用户接口 ====================

/**
 * 创建反馈
 */
export function apiCreateFeedback(payload) {
  return assistantFetch('/assistant/feedback/create', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 发表评论
 */
export function apiCreateComment(feedbackId, payload) {
  return assistantFetch(`/assistant/feedback/${feedbackId}/comment`, {
    method: 'POST',
    body: payload,
  })
}

// ==================== 反馈系统 - 管理员接口 ====================

/**
 * 创建公告（仅管理员）
 */
export function apiCreateAnnouncement(payload) {
  return assistantFetch('/admin/feedback/announcement/create', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 反馈管理列表（分页）
 */
export function apiAdminPageFeedback(params) {
  return assistantFetch('/admin/feedback/page', {
    method: 'POST',
    body: params,
  })
}

/**
 * 置顶反馈
 */
export function apiPinFeedback(feedbackId, pinOrder) {
  return assistantFetch(`/admin/feedback/${feedbackId}/pin`, {
    method: 'POST',
    params: { pinOrder },
  })
}

/**
 * 取消置顶
 */
export function apiUnpinFeedback(feedbackId) {
  return assistantFetch(`/admin/feedback/${feedbackId}/unpin`, {
    method: 'POST',
  })
}

/**
 * 更新反馈状态
 */
export function apiUpdateFeedbackStatus(feedbackId, payload) {
  return assistantFetch(`/admin/feedback/${feedbackId}/status`, {
    method: 'POST',
    body: payload,
  })
}

/**
 * 删除反馈
 */
export function apiDeleteFeedback(feedbackId) {
  return assistantFetch(`/admin/feedback/${feedbackId}`, {
    method: 'DELETE',
  })
}

// ==================== 反馈系统 - 互动接口（点赞、收藏）====================

/**
 * 点赞反馈
 */
export function apiLikeFeedback(feedbackId) {
  return assistantFetch(`/feedback/${feedbackId}/like`, {
    method: 'POST',
  })
}

/**
 * 取消点赞
 */
export function apiUnlikeFeedback(feedbackId) {
  return assistantFetch(`/feedback/${feedbackId}/like`, {
    method: 'DELETE',
  })
}

/**
 * 收藏反馈
 */
export function apiFavoriteFeedback(feedbackId) {
  return assistantFetch(`/feedback/${feedbackId}/favorite`, {
    method: 'POST',
  })
}

/**
 * 取消收藏
 */
export function apiUnfavoriteFeedback(feedbackId) {
  return assistantFetch(`/feedback/${feedbackId}/favorite`, {
    method: 'DELETE',
  })
}

// ==================== MCP 调试测试接口 ====================

/**
 * 健康检查
 */
export function apiMcpHealthCheck() {
  return $fetch('/public/mcp-debug/health', {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
  })
}

/**
 * 数据库连接测试
 */
export function apiMcpTestDatabase() {
  return $fetch('/public/mcp-debug/test-database', {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
  })
}

/**
 * 完整链路测试
 */
export function apiMcpTestFullChain() {
  return $fetch('/public/mcp-debug/test-full-chain', {
    baseURL: fetchConfig.baseURL,
    headers: { appid: fetchConfig.headers.appid },
  })
}
