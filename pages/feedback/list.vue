<template>
  <div class="page-wrapper">
    <!-- 面包屑 -->
    <div class="breadcrumb-box">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <nuxt-link to="/">首页</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>反馈列表</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="header-box">
      <div class="header-main">
        <h1 class="page-title">📋 反馈列表</h1>
      </div>
      <n-space>
        <n-button @click="goToMyFeedback">我的反馈</n-button>
        <n-button type="primary" @click="goToCreate">提交反馈</n-button>
      </n-space>
    </div>

    <!-- 公告区 -->
    <div v-if="announcements.length > 0" class="announcement-section">
      <div class="announcement-header">
        <span class="icon">📢</span>
        <span class="title">系统公告</span>
      </div>
      <div class="announcement-list">
        <div 
          v-for="item in announcements" 
          :key="item.id"
          class="announcement-item"
          @click="goToDetail(item.id)"
        >
          <span class="announcement-title">{{ item.title }}</span>
          <span class="announcement-time">{{ formatTime(item.createTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-box">
      <div class="filter-row">
        <n-space>
          <n-button
            :type="selectedCategoryId === null ? 'primary' : 'default'"
            @click="selectCategory(null)"
          >
            全部
          </n-button>
          <n-button
            v-for="category in categories"
            :key="category.id"
            :type="selectedCategoryId === category.id ? 'primary' : 'default'"
            @click="selectCategory(category.id)"
          >
            {{ resolveFeedbackCategoryIcon(category) }} {{ category.name }}
          </n-button>
        </n-space>
      </div>
      <div class="filter-row">
        <div class="filter-row-content">
          <n-select
            v-model:value="selectedStatus"
            :options="statusOptions"
            clearable
            placeholder="全部状态"
            style="width: 140px; margin-right: 12px;"
            @update:value="handleStatusChange"
          />
          <n-input
            v-model:value="keyword"
            placeholder="搜索反馈标题或内容..."
            clearable
            @keyup.enter="handleSearch"
            style="flex: 1;"
          >
            <template #suffix>
              <n-button text @click="handleSearch">
                🔍 搜索
              </n-button>
            </template>
          </n-input>
          <n-select
            v-model:value="sortType"
            :options="sortOptions"
            style="width: 140px; margin-left: 12px;"
            @update:value="handleSortChange"
          />
        </div>
      </div>
    </div>

    <!-- 置顶区 -->
    <div v-if="pinnedList.length > 0" class="pinned-section">
      <div class="section-header">
        <span class="icon">🔝</span>
        <span class="title">置顶反馈</span>
      </div>
      <div class="feedback-list">
        <div
          v-for="item in pinnedList"
          :key="item.id"
          class="feedback-card pinned"
          @click="goToDetail(item.id)"
        >
          <div class="pin-badge">置顶{{ item.pinOrder }}</div>
          <div class="card-header">
            <span class="category-icon">{{ resolveFeedbackCategoryIcon(item) }}</span>
            <span class="category-name">{{ item.categoryName }}</span>
            <span class="status-badge" :class="`status-${item.status}`">
              {{ resolveFeedbackStatusText(item.status) }}
            </span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-content">{{ item.contentPreview || '' }}{{ item.contentPreview ? '...' : '' }}</p>
          <div class="card-footer">
            <span class="user">👤 {{ getFeedbackUserName(item) }}</span>
            <span class="stats">
              👍 {{ item.likeCount || 0 }} · ⭐ {{ item.favoriteCount || 0 }} · 💬 {{ item.commentCount }} · 👁 {{ item.viewCount }}
            </span>
            <span class="time">📅 {{ formatTime(item.createTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 普通反馈列表 -->
    <div class="feedback-section">
      <div class="section-header">
        <span class="icon">📋</span>
        <span class="title">全部反馈</span>
      </div>
      <div v-if="loading" class="loading-box">
        <div class="feedback-skeleton-list">
          <div v-for="index in pageSize" :key="index" class="feedback-skeleton-card">
            <div class="skeleton-line short" />
            <div class="skeleton-line title" />
            <div class="skeleton-line" />
            <div class="skeleton-line" />
            <div class="skeleton-line footer" />
          </div>
        </div>
      </div>
      <div v-else-if="feedbackList.length === 0" class="empty-box">
        <n-empty description="暂无反馈" />
      </div>
      <div v-else class="feedback-list">
        <div
          v-for="item in feedbackList"
          :key="item.id"
          class="feedback-card"
          @click="goToDetail(item.id)"
        >
          <div class="card-header">
            <span class="category-icon">{{ resolveFeedbackCategoryIcon(item) }}</span>
            <span class="category-name">{{ item.categoryName }}</span>
            <span class="status-badge" :class="`status-${item.status}`">
              {{ resolveFeedbackStatusText(item.status) }}
            </span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-content">{{ item.contentPreview || '' }}{{ item.contentPreview ? '...' : '' }}</p>
          <div class="card-footer">
            <span class="user">👤 {{ getFeedbackUserName(item) }}</span>
            <span class="stats">
              👍 {{ item.likeCount || 0 }} · ⭐ {{ item.favoriteCount || 0 }} · 💬 {{ item.commentCount }} · 👁 {{ item.viewCount }}
            </span>
            <span class="time">📅 {{ formatTime(item.createTime) }}</span>
          </div>
        </div>
      </div>

      <div ref="loadMoreTriggerRef" class="load-more-sentinel">
        <n-spin v-if="loadingMore" size="small" />
        <span v-else-if="!hasMore && feedbackList.length > 0" class="load-more-finished">
          你已经浏览完全部反馈了
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onActivated, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NButton, NInput, NSpace, NBreadcrumb, NBreadcrumbItem, NSpin, NEmpty, NSelect } from 'naive-ui'
import { 
  apiGetFeedbackCategories, 
  apiPageFeedback,
  resolveFeedbackCategoryIcon,
  resolveFeedbackStatusText,
  resolveFeedbackErrorMessage
} from '~/composables/assistant'
import { applyFeedbackInteractionPatches } from '~/composables/useFeedbackState'

const router = useRouter()
const message = useMessage()

const categories = ref([])
const announcements = ref([])
const pinnedList = ref([])
const feedbackList = ref([])
const selectedCategoryId = ref(null)
const selectedStatus = ref(null)
const keyword = ref('')
const sortType = ref('hot') // 默认按最热排序
const pageNum = ref(1)
const pageSize = ref(9)
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const loadMoreTriggerRef = ref(null)
const loadMoreObserver = ref(null)
const lastLoadMoreAt = ref(0)
const hasUserScrolled = ref(false)

// 排序选项
const sortOptions = [
  { label: '🔥 最热', value: 'hot' },
  { label: '🆕 最新', value: 'latest' },
  { label: '💬 最多评论', value: 'comment' }
]
const statusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'PROCESSING' },
  { label: '已解决', value: 'RESOLVED' },
  { label: '已关闭', value: 'CLOSED' }
]

const hasMore = computed(() => (feedbackList.value.length + pinnedList.value.length) < total.value)

onMounted(() => {
  if (process.client) {
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
  }
  loadCategories()
  loadAnnouncements()
  loadFeedback()
})

onActivated(() => {
  applyPatchedFeedbackList()
})

watch(loadMoreTriggerRef, (currentValue) => {
  if (currentValue) {
    initLoadMoreObserver()
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleWindowScroll)
  }
  destroyLoadMoreObserver()
})

async function loadCategories() {
  try {
    const res = await apiGetFeedbackCategories()
    categories.value = res.data || []
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载分类失败'))
    console.error('加载分类失败:', error)
  }
}

async function loadAnnouncements() {
  try {
    const res = await apiPageFeedback({
      isAnnouncement: 1,
      status: selectedStatus.value,
      pageNum: 1,
      pageSize: 5
    })
    announcements.value = res.rows || []
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载公告失败'))
    console.error('加载公告失败:', error)
  }
}

async function loadFeedback() {
  loading.value = true
  try {
    pageNum.value = 1
    hasUserScrolled.value = false
    await fetchFeedbackPage(pageNum.value)
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载反馈失败'))
    console.error('加载反馈失败:', error)
  } finally {
    loading.value = false
  }
}

function getFeedbackUserName(item) {
  return item?.userName || `用户${item?.userId || ''}`
}

function selectCategory(categoryId) {
  selectedCategoryId.value = categoryId
  loadFeedback()
}

function handleStatusChange() {
  loadFeedback()
}

function handleSearch() {
  loadFeedback()
}

function handleSortChange() {
  loadFeedback()
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }

  if (pageNum.value === 1 && !hasUserScrolled.value) {
    return
  }

  const now = Date.now()
  if (now - lastLoadMoreAt.value < 300) {
    return
  }
  lastLoadMoreAt.value = now

  loadingMore.value = true
  try {
    await fetchFeedbackPage(pageNum.value + 1)
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载更多失败'))
  } finally {
    loadingMore.value = false
  }
}

function goToDetail(id) {
  router.push(`/feedback/detail/${id}`)
}

function goToCreate() {
  router.push('/feedback/create')
}

function goToMyFeedback() {
  router.push('/feedback/my')
}

function handleWindowScroll() {
  if (!process.client || hasUserScrolled.value) {
    return
  }
  if (window.scrollY > 24) {
    hasUserScrolled.value = true
  }
}

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

async function fetchFeedbackPage(nextPageNum) {
  const res = await apiPageFeedback({
    categoryId: selectedCategoryId.value,
    status: selectedStatus.value,
    keyword: keyword.value,
    isAnnouncement: 0,
    sortType: sortType.value,
    pageNum: nextPageNum,
    pageSize: pageSize.value
  })

  const rows = applyFeedbackInteractionPatches(res.rows || [])
  const pinned = rows.filter(item => item.isPinned === 1)
  const normal = rows.filter(item => item.isPinned === 0)

  if (nextPageNum === 1) {
    pinnedList.value = pinned
    feedbackList.value = normal
  } else {
    feedbackList.value.push(...normal)
  }

  pageNum.value = nextPageNum
  total.value = res.total || 0
}

function applyPatchedFeedbackList() {
  pinnedList.value = applyFeedbackInteractionPatches(pinnedList.value)
  feedbackList.value = applyFeedbackInteractionPatches(feedbackList.value)
}

function initLoadMoreObserver() {
  if (!process.client || !loadMoreTriggerRef.value || loadMoreObserver.value) {
    return
  }

  loadMoreObserver.value = new IntersectionObserver(entries => {
    const [entry] = entries
    if (entry?.isIntersecting) {
      loadMore()
    }
  }, {
    rootMargin: '200px 0px',
  })

  loadMoreObserver.value.observe(loadMoreTriggerRef.value)
}

function destroyLoadMoreObserver() {
  if (!loadMoreObserver.value) {
    return
  }

  loadMoreObserver.value.disconnect()
  loadMoreObserver.value = null
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

.header-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.header-main {
  min-width: 0;
}

.feedback-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.feedback-skeleton-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.skeleton-line {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #eef2f6 25%, #f7f9fb 50%, #eef2f6 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  margin-bottom: 12px;
}

.skeleton-line.short {
  width: 120px;
}

.skeleton-line.title {
  width: 56%;
  height: 18px;
}

.skeleton-line.footer {
  width: 72%;
  margin-bottom: 0;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.page-desc {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #667085;
}

/* 公告区 */
.announcement-section {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.announcement-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #e65100;
}

.announcement-header .icon {
  font-size: 20px;
  margin-right: 8px;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 自定义滚动条样式 */
.announcement-list::-webkit-scrollbar {
  width: 6px;
}

.announcement-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.announcement-list::-webkit-scrollbar-thumb {
  background: rgba(255, 152, 0, 0.4);
  border-radius: 3px;
  transition: background 0.2s;
}

.announcement-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 152, 0, 0.6);
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.announcement-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
}

.announcement-title {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.announcement-time {
  font-size: 12px;
  color: #666;
}

/* 筛选器 */
.filter-box {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.filter-row {
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-row-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.section-header .icon {
  font-size: 22px;
  margin-right: 8px;
}

/* 置顶区 */
.pinned-section {
  margin-bottom: 24px;
}

/* 反馈列表 */
.feedback-section {
  margin-bottom: 80px;
}

.feedback-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* 反馈卡片 */
.feedback-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.feedback-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.feedback-card.pinned {
  border: 2px solid #ff9800;
  background: linear-gradient(135deg, #fff 0%, #fff8f0 100%);
}

.pin-badge {
  display: inline-block;
  background: #ff9800;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.category-icon {
  font-size: 18px;
  margin-right: 6px;
}

.category-name {
  font-size: 13px;
  color: #666;
}

.status-badge {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
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

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.card-footer .user,
.card-footer .stats,
.card-footer .time {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 加载状态 */
.loading-box,
.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
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

  .header-box {
    flex-direction: column;
    align-items: stretch;
  }

  .feedback-list {
    grid-template-columns: 1fr;
  }
}
</style>
