<template>
  <div class="page-wrapper">
    <div class="breadcrumb-box">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <nuxt-link to="/">首页</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <nuxt-link to="/feedback/list">反馈列表</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>反馈详情</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div v-if="loading" class="loading-box">
      <n-spin size="large" />
    </div>

    <div v-else-if="!detail" class="error-box">
      <n-empty description="加载失败或反馈不存在">
        <template #extra>
          <n-button @click="loadPageData">
            重新加载
          </n-button>
        </template>
      </n-empty>
    </div>

    <div v-else class="content-wrapper">
      <!-- 反馈详情 -->
      <div class="detail-card">
        <div class="detail-header">
          <div class="category-badge">
            <span class="icon">{{ resolveFeedbackCategoryIcon(detail) }}</span>
            <span class="name">{{ detail.categoryName }}</span>
          </div>
          <div class="status-badge" :class="`status-${detail.status}`">
            {{ detail.statusText || resolveFeedbackStatusText(detail.status) }}
          </div>
          <div v-if="detail.isPinned" class="pin-badge">
            🔝 置顶{{ detail.pinOrder }}
          </div>
        </div>

        <h1 class="detail-title">{{ detail.title }}</h1>

        <div v-if="detail.tags?.length" class="tag-row">
          <span v-for="tag in detail.tags" :key="tag.id" class="feedback-tag">{{ tag.name }}</span>
        </div>

        <div class="detail-meta">
          <span class="meta-item">
            <span class="icon">👤</span>
            <span>{{ getFeedbackUserName(detail) }}</span>
          </span>
          <span class="meta-item">
            <span class="icon">📅</span>
            <span>{{ formatTime(detail.createTime) }}</span>
          </span>
          <span class="meta-item">
            <span class="icon">👁</span>
            <span>{{ detail.viewCount }} 浏览</span>
          </span>
          <span class="meta-item">
            <span class="icon">💬</span>
            <span>{{ detail.commentCount }} 评论</span>
          </span>
          <span class="meta-item">
            <span class="icon">👍</span>
            <span>{{ detail.likeCount || 0 }} 点赞</span>
          </span>
          <span class="meta-item">
            <span class="icon">⭐</span>
            <span>{{ detail.favoriteCount || 0 }} 收藏</span>
          </span>
        </div>

        <div class="detail-content">
          {{ detail.content }}
        </div>

        <div v-if="showAdminActions" class="admin-action-panel">
          <div class="admin-action-header">
            <span class="title">管理员处理</span>
            <span class="hint">状态变更会自动记录到处理时间线</span>
          </div>
          <div class="admin-action-buttons">
            <n-button
              v-for="action in availableStatusActions"
              :key="action.value"
              :type="action.type"
              :disabled="adminUpdating"
              @click="openStatusDialog(action)"
            >
              {{ action.label }}
            </n-button>
          </div>
        </div>

        <!-- 互动按钮区（移到内容下方） -->
        <div class="interaction-bar">
          <n-button
            :type="isLiked ? 'primary' : 'default'"
            :loading="likingLoading"
            :disabled="!isLoggedIn || likingLoading"
            @click="handleLike"
          >
            <span class="btn-icon">{{ isLiked ? '👍' : '👍🏻' }}</span>
            <span>{{ isLiked ? '已点赞' : (isLoggedIn ? '点赞' : '登录后可点赞') }}</span>
          </n-button>
          <n-button
            :type="isFavorited ? 'warning' : 'default'"
            :loading="favoritingLoading"
            :disabled="!isLoggedIn || favoritingLoading"
            @click="handleFavorite"
          >
            <span class="btn-icon">{{ isFavorited ? '⭐' : '☆' }}</span>
            <span>{{ isFavorited ? '已收藏' : (isLoggedIn ? '收藏' : '登录后可收藏') }}</span>
          </n-button>
        </div>
      </div>

      <div v-if="detail.processRecords?.length" class="process-card">
        <h2 class="process-title">🕒 处理时间线</h2>
        <div class="process-timeline">
          <div
            v-for="record in detail.processRecords"
            :key="record.id"
            class="timeline-item"
          >
            <div class="timeline-dot" />
            <div class="timeline-body">
              <div class="timeline-title">
                {{ getTimelineTitle(record) }}
              </div>
              <div class="timeline-meta">
                <span>{{ formatAbsoluteTime(record.createTime) }}</span>
                <span>{{ record.operatorName || '系统' }}</span>
              </div>
              <div v-if="record.remark" class="timeline-remark">
                说明：{{ record.remark }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论区 -->
      <div v-if="detail.allowComment" ref="commentSectionRef" class="comment-section">
        <h2 class="comment-title">💬 评论 ({{ detail.commentCount }})</h2>

        <!-- 发表评论表单 -->
        <div class="comment-form">
          <n-input
            v-model:value="commentContent"
            type="textarea"
            :rows="3"
            placeholder="发表你的评论..."
            maxlength="500"
            show-count
          />
          <div class="form-actions">
            <n-button type="primary" @click="handleSubmitComment" :loading="submittingComment">
              发表评论
            </n-button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div v-if="commentLoading" class="loading-box compact">
          <n-spin size="small" />
        </div>

        <div v-else-if="comments.length > 0" class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <!-- 一级评论 -->
            <div class="comment-main">
              <div class="comment-avatar">
                {{ getCommentAvatarText(comment) }}
              </div>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="comment-user">{{ getCommentUserName(comment) }}</span>
                  <span v-if="comment.isAdminReply" class="admin-badge">管理员</span>
                  <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-actions">
                  <n-button text size="small" @click="handleReply(comment)">
                    回复
                  </n-button>
                </div>
              </div>
            </div>

            <!-- 二级评论（回复） -->
            <div v-if="comment.replies && comment.replies.length > 0" class="reply-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="comment-avatar small">
                  {{ getCommentAvatarText(reply) }}
                </div>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-user">{{ getCommentUserName(reply) }}</span>
                    <span v-if="reply.isAdminReply" class="admin-badge">管理员</span>
                    <span class="reply-to">回复 @{{ getReplyToUserName(reply) }}</span>
                    <span class="comment-time">{{ formatTime(reply.createTime) }}</span>
                  </div>
                  <div class="comment-content">{{ reply.content }}</div>
                  <div class="comment-actions">
                    <n-button text size="small" @click="handleReply(reply, comment.id)">
                      回复
                    </n-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 回复表单 -->
            <div v-if="replyingTo === comment.id" class="reply-form">
              <n-input
                v-model:value="replyContent"
                type="textarea"
                :rows="2"
                :placeholder="`回复 @${replyToUserName || '用户'}...`"
                maxlength="500"
                show-count
              />
              <div class="form-actions">
                <n-button size="small" type="primary" @click="handleSubmitReply" :loading="submittingReply">
                  发表回复
                </n-button>
                <n-button size="small" @click="cancelReply">
                  取消
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="commentsLoaded" class="empty-comments">
          <n-empty description="暂无评论，快来发表第一条评论吧！" />
        </div>

        <div v-else class="empty-comments">
          <n-button text type="primary" @click="ensureCommentsLoaded">
            点击加载评论
          </n-button>
        </div>

        <!-- 加载更多评论 -->
        <div v-if="hasMoreComments" class="load-more-box">
          <n-button @click="loadMoreComments" :loading="loadingMoreComments">
            加载更多评论
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NButton, NInput, NSpin, NEmpty, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import {
  assertAssistantResponseSuccess,
  apiGetFeedbackDetail,
  apiGetFeedbackComments,
  apiGetFeedbackProcessRecords,
  apiCreateComment,
  apiLikeFeedback,
  apiUnlikeFeedback,
  apiFavoriteFeedback,
  apiUnfavoriteFeedback,
  apiGetFeedbackInteractionStatus,
  apiUpdateFeedbackStatus,
  resolveFeedbackCategoryIcon,
  resolveFeedbackStatusText,
  resolveFeedbackErrorMessage
} from '~/composables/assistant'
import { patchFeedbackInteraction } from '~/composables/useFeedbackState'
import { usePermission } from '~/composables/usePermission'

// 使用全局用户状态（响应式，登录状态变化会自动更新）
const user = useUser()

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { hasPermission } = usePermission()

const loading = ref(true)
const detail = ref(null)
const comments = ref([])
const commentContent = ref('')
const submittingComment = ref(false)
const commentLoading = ref(false)

const replyingTo = ref(null)
const replyContent = ref('')
const replyToUserId = ref(null)
const replyToUserName = ref('')
const replyRootId = ref(null)
const submittingReply = ref(false)

const commentPageNum = ref(1)
const commentPageSize = ref(10)
const hasMoreComments = ref(false)
const loadingMoreComments = ref(false)
const commentSectionRef = ref(null)
const commentObserver = ref(null)
const commentsLoaded = ref(false)

// 互动状态
const isLiked = ref(false)
const isFavorited = ref(false)
const likingLoading = ref(false)
const favoritingLoading = ref(false)
const adminUpdating = ref(false)

// 登录状态检查（基于全局用户状态，响应式更新）
const isLoggedIn = computed(() => {
  return !!user.value
})
const showAdminActions = computed(() => {
  return !!detail.value && hasPermission('system:feedback:manage')
})
const availableStatusActions = computed(() => {
  const currentStatus = detail.value?.status
  if (currentStatus === 'PENDING') {
    return [
      { label: '标记为处理中', value: 'PROCESSING', type: 'primary', placeholder: '请输入开始处理说明' },
      { label: '关闭反馈', value: 'CLOSED', type: 'warning', placeholder: '请输入关闭原因' }
    ]
  }
  if (currentStatus === 'PROCESSING') {
    return [
      { label: '标记为已解决', value: 'RESOLVED', type: 'success', placeholder: '请输入处理完成说明' },
      { label: '关闭反馈', value: 'CLOSED', type: 'warning', placeholder: '请输入关闭原因' }
    ]
  }
  return []
})

function assertFeedbackSuccess(res, fallbackMessage) {
  if (res?.code === 200) return
  throw new Error(res?.msg || fallbackMessage)
}

function getCommentUserName(comment) {
  return comment?.userName || `用户${comment?.userId || ''}`
}

function getFeedbackUserName(feedback) {
  return feedback?.userName || `用户${feedback?.userId || ''}`
}

function getCommentAvatarText(comment) {
  return getCommentUserName(comment).charAt(0)
}

function getReplyToUserName(comment) {
  return comment?.replyToUserName || '用户'
}

onMounted(async () => {
  await loadDetail()
  await nextTick()
  initCommentObserver()
  if (route.query.created === '1') {
    message.success('反馈提交成功')
    router.replace({ path: route.path })
  }
})

onBeforeUnmount(() => {
  destroyCommentObserver()
})

watch(commentSectionRef, (currentValue) => {
  if (currentValue) {
    initCommentObserver()
  }
})

/**
 * 加载页面数据（独立方法，支持重新加载）
 */
async function loadPageData() {
  loading.value = true

  try {
    await loadDetail()
  } finally {
    loading.value = false
  }
}

/**
 * 带超时的 API 调用包装器
 * @param {Function} apiCall - API 调用函数
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @returns {Promise} API 响应
 */
function withTimeout(apiCall, timeoutMs = 10000) {
  return Promise.race([
    apiCall(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('请求超时，请稍后重试')), timeoutMs)
    )
  ])
}

async function loadDetail() {
  try {
    const res = await withTimeout(() => apiGetFeedbackDetail(route.params.id), 10000)
    assertFeedbackSuccess(res, '加载详情失败')
    detail.value = res.data
    await ensureProcessRecords()

    syncInteractionStateFromDetail()
    if (isLoggedIn.value) {
      await syncInteractionStatus(true)
    }

    loading.value = false
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载详情失败'))
    detail.value = null
    loading.value = false
  }
}

async function ensureProcessRecords() {
  if (!detail.value) {
    return
  }
  if (Array.isArray(detail.value.processRecords) && detail.value.processRecords.length > 0) {
    return
  }
  try {
    const res = await apiGetFeedbackProcessRecords(route.params.id)
    assertFeedbackSuccess(res, '加载处理记录失败')
    detail.value.processRecords = res.data || []
  } catch (error) {
    detail.value.processRecords = []
  }
}

async function handleLike() {
  if (likingLoading.value || !detail.value) {
    return
  }

  // 检查是否登录
  if (!isLoggedIn.value) {
    message.warning('请先登录后再点赞')
    // 可选：跳转到登录页
    // navigateTo('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    likingLoading.value = true

    const currentLiked = isLiked.value
    if (currentLiked) {
      // 取消点赞
      const res = await apiUnlikeFeedback(route.params.id)
      assertAssistantResponseSuccess(res, '取消点赞失败')
      message.success('已取消点赞')
      applyLikeState(false)
      syncFeedbackInteractionPatch()
    } else {
      // 点赞
      const res = await apiLikeFeedback(route.params.id)
      assertAssistantResponseSuccess(res, '点赞失败')
      message.success('点赞成功')
      applyLikeState(true)
      syncFeedbackInteractionPatch()
    }
  } catch (error) {
    const errorMessage = resolveFeedbackErrorMessage(error, '操作失败')
    if (errorMessage.includes('已经点赞过')) {
      syncLikeState(true)
      await syncInteractionStatus(true)
      syncFeedbackInteractionPatch()
      message.success('已同步为点赞状态')
      return
    }
    if (errorMessage.includes('还未点赞')) {
      syncLikeState(false)
      await syncInteractionStatus(true)
      syncFeedbackInteractionPatch()
      message.success('已同步为未点赞状态')
      return
    }
    message.error(errorMessage)
  } finally {
    likingLoading.value = false
  }
}

async function handleFavorite() {
  if (favoritingLoading.value || !detail.value) {
    return
  }

  // 检查是否登录
  if (!isLoggedIn.value) {
    message.warning('请先登录后再收藏')
    // 可选：跳转到登录页
    // navigateTo('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    favoritingLoading.value = true

    const currentFavorited = isFavorited.value
    if (currentFavorited) {
      // 取消收藏
      const res = await apiUnfavoriteFeedback(route.params.id)
      assertAssistantResponseSuccess(res, '取消收藏失败')
      message.success('已取消收藏')
      applyFavoriteState(false)
      syncFeedbackInteractionPatch()
    } else {
      // 收藏
      const res = await apiFavoriteFeedback(route.params.id)
      assertAssistantResponseSuccess(res, '收藏失败')
      message.success('收藏成功')
      applyFavoriteState(true)
      syncFeedbackInteractionPatch()
    }
  } catch (error) {
    const errorMessage = resolveFeedbackErrorMessage(error, '操作失败')
    if (errorMessage.includes('已经收藏过')) {
      syncFavoriteState(true)
      await syncInteractionStatus(true)
      syncFeedbackInteractionPatch()
      message.success('已同步为收藏状态')
      return
    }
    if (errorMessage.includes('还未收藏')) {
      syncFavoriteState(false)
      await syncInteractionStatus(true)
      syncFeedbackInteractionPatch()
      message.success('已同步为未收藏状态')
      return
    }
    message.error(errorMessage)
  } finally {
    favoritingLoading.value = false
  }
}

function syncInteractionStateFromDetail() {
  if (!detail.value) {
    isLiked.value = false
    isFavorited.value = false
    return
  }

  isLiked.value = !!detail.value.isLiked
  isFavorited.value = !!detail.value.isFavorited
}

function applyLikeState(nextLiked) {
  if (!detail.value || isLiked.value === nextLiked) {
    return
  }

  const currentCount = Number(detail.value.likeCount) || 0
  isLiked.value = nextLiked
  detail.value.isLiked = nextLiked
  detail.value.likeCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
}

function syncLikeState(nextLiked) {
  if (!detail.value) {
    return
  }

  isLiked.value = nextLiked
  detail.value.isLiked = nextLiked
}

function applyFavoriteState(nextFavorited) {
  if (!detail.value || isFavorited.value === nextFavorited) {
    return
  }

  const currentCount = Number(detail.value.favoriteCount) || 0
  isFavorited.value = nextFavorited
  detail.value.isFavorited = nextFavorited
  detail.value.favoriteCount = nextFavorited ? currentCount + 1 : Math.max(0, currentCount - 1)
}

function syncFavoriteState(nextFavorited) {
  if (!detail.value) {
    return
  }

  isFavorited.value = nextFavorited
  detail.value.isFavorited = nextFavorited
}

async function syncInteractionStatus(silent = false) {
  if (!isLoggedIn.value || !detail.value) {
    return
  }

  try {
    const res = await apiGetFeedbackInteractionStatus(route.params.id)
    assertAssistantResponseSuccess(res, '获取互动状态失败')
    const interactionStatus = res.data || {}
    isLiked.value = !!interactionStatus.isLiked
    isFavorited.value = !!interactionStatus.isFavorited
    detail.value.isLiked = isLiked.value
    detail.value.isFavorited = isFavorited.value
  } catch (error) {
    if (!silent) {
      message.error(resolveFeedbackErrorMessage(error, '同步互动状态失败'))
    }
  }
}

async function loadComments() {
  if (!detail.value || commentsLoaded.value && commentPageNum.value === 1) {
    return true
  }

  try {
    commentLoading.value = commentPageNum.value === 1
    const res = await withTimeout(
      () => apiGetFeedbackComments(
        route.params.id,
        commentPageNum.value,
        commentPageSize.value
      ),
      10000
    )
    assertFeedbackSuccess(res, '加载评论失败')

    const newComments = Array.isArray(res.data) ? res.data : []

    if (commentPageNum.value === 1) {
      comments.value = newComments
      commentsLoaded.value = true
    } else {
      comments.value.push(...newComments)
    }

    hasMoreComments.value = newComments.length === commentPageSize.value
    return true
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载评论失败'))
    return false
  } finally {
    commentLoading.value = false
  }
}

async function refreshFeedbackAfterComment() {
  commentPageNum.value = 1
  commentsLoaded.value = false
  const results = await Promise.allSettled([loadComments(), loadDetail()])
  const hasRefreshFailed = results.some(result => result.status === 'rejected' || result.value === false)
  if (hasRefreshFailed) {
    message.warning('评论已发表，刷新评论列表失败，请稍后手动刷新')
  }
}

async function handleSubmitComment() {
  if (!commentContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }

  await ensureCommentsLoaded()

  try {
    submittingComment.value = true
    const res = await apiCreateComment(route.params.id, {
      content: commentContent.value,
      parentId: 0
    })
    assertFeedbackSuccess(res, '评论失败')
    message.success('评论成功')
    commentContent.value = ''
    submittingComment.value = false
    await refreshFeedbackAfterComment()
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '评论失败'))
  } finally {
    submittingComment.value = false
  }
}

function handleReply(comment, rootId = null) {
  replyingTo.value = rootId || comment.id
  replyToUserId.value = comment.userId
  replyToUserName.value = getCommentUserName(comment)
  replyRootId.value = rootId || comment.id
  replyContent.value = ''
}

async function handleSubmitReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  await ensureCommentsLoaded()

  try {
    submittingReply.value = true
    const res = await apiCreateComment(route.params.id, {
      content: replyContent.value,
      parentId: replyingTo.value,
      replyToUserId: replyToUserId.value,
      replyToUserName: replyToUserName.value
    })
    assertFeedbackSuccess(res, '回复失败')
    message.success('回复成功')
    cancelReply()
    submittingReply.value = false
    await refreshFeedbackAfterComment()
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '回复失败'))
  } finally {
    submittingReply.value = false
  }
}

function cancelReply() {
  replyingTo.value = null
  replyContent.value = ''
  replyToUserId.value = null
  replyToUserName.value = ''
  replyRootId.value = null
}

async function loadMoreComments() {
  await ensureCommentsLoaded()
  try {
    loadingMoreComments.value = true
    commentPageNum.value++
    const success = await loadComments()
    if (!success) {
      commentPageNum.value = Math.max(1, commentPageNum.value - 1)
    }
  } finally {
    loadingMoreComments.value = false
  }
}

async function ensureCommentsLoaded() {
  if (commentsLoaded.value) {
    return true
  }

  commentPageNum.value = 1
  commentsLoaded.value = false
  return loadComments()
}

function initCommentObserver() {
  if (!process.client || !detail.value?.allowComment || !commentSectionRef.value || commentObserver.value) {
    return
  }

  commentObserver.value = new IntersectionObserver(entries => {
    const [entry] = entries
    if (entry?.isIntersecting) {
      ensureCommentsLoaded()
      destroyCommentObserver()
    }
  }, {
    rootMargin: '200px 0px',
  })

  commentObserver.value.observe(commentSectionRef.value)
}

function destroyCommentObserver() {
  if (!commentObserver.value) {
    return
  }

  commentObserver.value.disconnect()
  commentObserver.value = null
}

function syncFeedbackInteractionPatch() {
  if (!detail.value?.id) {
    return
  }

  patchFeedbackInteraction(detail.value.id, {
    likeCount: detail.value.likeCount || 0,
    favoriteCount: detail.value.favoriteCount || 0,
    isLiked: isLiked.value,
    isFavorited: isFavorited.value,
  })
}

async function openStatusDialog(action) {
  const remark = window.prompt(action.placeholder, '')
  if (remark === null) {
    return
  }
  const trimmedRemark = remark.trim()
  if (!trimmedRemark) {
    message.warning('请输入处理说明')
    return
  }
  await updateStatus(action.value, trimmedRemark)
}

async function updateStatus(toStatus, remark) {
  if (!detail.value) {
    return
  }
  try {
    adminUpdating.value = true
    const res = await apiUpdateFeedbackStatus(route.params.id, {
      toStatus,
      remark
    })
    assertAssistantResponseSuccess(res, '更新状态失败')
    message.success('状态更新成功')
    await loadDetail()
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '更新状态失败'))
  } finally {
    adminUpdating.value = false
  }
}

function getTimelineTitle(record) {
  if (!record?.fromStatus) {
    return record?.remark || '用户提交反馈'
  }
  return `${resolveFeedbackStatusText(record.fromStatus)} → ${resolveFeedbackStatusText(record.toStatus)}`
}

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

function formatAbsoluteTime(time) {
  if (!time) {
    return ''
  }
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  padding: 24px 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 40px);
}

.breadcrumb-box {
  margin-bottom: 20px;
}

.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 0;
}

.content-wrapper {
  max-width: 1120px;
  margin: 0 auto;
}

/* 详情卡片 */
.detail-card {
  background: #fff;
  padding: 36px 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f7ff;
  border-radius: 20px;
  font-size: 14px;
  color: #667eea;
}

.category-badge .icon {
  font-size: 16px;
}

.pin-badge {
  padding: 6px 12px;
  background: #ff9800;
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-PENDING {
  background: #fff7e6;
  color: #d97706;
}

.status-PROCESSING {
  background: #e0f2fe;
  color: #0369a1;
}

.status-RESOLVED {
  background: #dcfce7;
  color: #15803d;
}

.status-CLOSED {
  background: #f3f4f6;
  color: #4b5563;
}

.detail-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.feedback-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  line-height: 1;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.meta-item .icon {
  font-size: 16px;
}

.detail-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  margin-bottom: 24px;
}

.admin-action-panel,
.process-card {
  background: #fff;
  padding: 24px 28px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.admin-action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.admin-action-header .title,
.process-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.admin-action-header .hint {
  font-size: 13px;
  color: #666;
}

.admin-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.process-title {
  margin: 0 0 20px;
}

.process-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  flex-shrink: 0;
}

.timeline-body {
  flex: 1;
  padding-bottom: 20px;
  border-bottom: 1px solid #eef2f7;
}

.timeline-item:last-child .timeline-body {
  padding-bottom: 0;
  border-bottom: none;
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.timeline-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.timeline-remark {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}

/* 互动按钮区（移到内容下方） */
.interaction-bar {
  display: flex;
  gap: 12px;
  padding: 24px 0;
  border-top: 1px solid #e0e0e0;
  margin-bottom: 0;
}

.interaction-bar .n-button {
  flex: 1;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: 500;
}

.interaction-bar .btn-icon {
  font-size: 20px;
  margin-right: 8px;
}

/* 评论区 */
.comment-section {
  background: #fff;
  padding: 36px 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.comment-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 评论表单 */
.comment-form,
.reply-form {
  margin-bottom: 32px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.admin-badge {
  padding: 2px 8px;
  background: #ff9800;
  color: white;
  border-radius: 10px;
  font-size: 11px;
}

.reply-to {
  font-size: 13px;
  color: #667eea;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

/* 回复列表 */
.reply-list {
  margin-left: 52px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  display: flex;
  gap: 12px;
}

.reply-form {
  margin-left: 52px;
  margin-top: 16px;
}

.empty-comments {
  padding: 60px 0;
}

.load-more-box {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 12px;
  }

  .detail-card,
  .comment-section {
    padding: 20px 16px;
  }
  
  .detail-title {
    font-size: 22px;
  }
  
  .reply-list {
    margin-left: 32px;
  }
  
  .reply-form {
    margin-left: 32px;
  }
}
</style>
