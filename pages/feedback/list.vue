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
        <n-button type="primary" @click="goToCreate">提交反馈</n-button>
      </n-space>
    </div>

    <div class="view-mode-box">
      <n-tabs
        :value="queryMode"
        type="line"
        size="medium"
        animated
        @update:value="selectQueryMode"
      >
        <n-tab
          v-for="option in queryModeOptions"
          :key="option.value"
          :name="option.value"
        >
          {{ option.label }}
        </n-tab>
      </n-tabs>
    </div>

    <!-- 公告区 -->
    <div v-if="showAnnouncements && announcements.length > 0" class="announcement-section">
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
      <div class="category-chip-row">
        <button
          type="button"
          class="category-chip"
          :class="{ 'is-active': selectedCategoryId === null }"
          @click="selectCategory(null)"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="category-chip"
          :class="{ 'is-active': selectedCategoryId === category.id }"
          @click="selectCategory(category.id)"
        >
          <span class="chip-icon">{{ resolveFeedbackCategoryIcon(category) }}</span>
          <span class="chip-label">{{ category.name }}</span>
        </button>
      </div>
      <div class="filter-row">
        <div class="filter-row-content">
          <n-input
            v-model:value="keyword"
            placeholder="搜索反馈标题或内容..."
            clearable
            class="filter-search"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <n-button text @click="handleSearch">
                🔍 搜索
              </n-button>
            </template>
          </n-input>
          <n-select
            v-model:value="selectedTagIds"
            multiple
            clearable
            filterable
            max-tag-count="responsive"
            :options="tagOptions"
            placeholder="按标签筛选"
            class="filter-control filter-tags"
            @update:value="handleTagChange"
          />
          <n-select
            v-model:value="selectedStatus"
            :options="statusOptions"
            clearable
            placeholder="全部状态"
            class="filter-control filter-status"
            @update:value="handleStatusChange"
          />
          <n-select
            v-model:value="sortType"
            :options="sortOptions"
            class="filter-control filter-sort"
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
          <div v-if="item.tags?.length" class="tag-row">
            <span v-for="tag in item.tags" :key="tag.id" class="feedback-tag">{{ tag.name }}</span>
          </div>
          <p class="card-content">{{ item.contentPreview || '' }}{{ item.contentPreview ? '...' : '' }}</p>
          <div class="card-footer">
            <div class="card-footer-meta">
              <span class="footer-user">👤 {{ getFeedbackUserName(item) }}</span>
              <span class="footer-time">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="card-footer-stats">
              <span class="stat-chip" title="点赞数">
                <span class="stat-icon">👍</span>{{ item.likeCount || 0 }}
              </span>
              <span class="stat-chip" title="评论数">
                <span class="stat-icon">💬</span>{{ item.commentCount || 0 }}
              </span>
              <span class="stat-chip" title="浏览数">
                <span class="stat-icon">👁</span>{{ item.viewCount || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 普通反馈列表 -->
    <div class="feedback-section">
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
      <div v-else-if="feedbackList.length === 0 && pinnedList.length === 0" class="empty-box">
        <n-empty :description="emptyDescription" />
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
          <div v-if="item.tags?.length" class="tag-row">
            <span v-for="tag in item.tags" :key="tag.id" class="feedback-tag">{{ tag.name }}</span>
          </div>
          <p class="card-content">{{ item.contentPreview || '' }}{{ item.contentPreview ? '...' : '' }}</p>
          <div class="card-footer">
            <div class="card-footer-meta">
              <span class="footer-user">👤 {{ getFeedbackUserName(item) }}</span>
              <span class="footer-time">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="card-footer-stats">
              <span class="stat-chip" title="点赞数">
                <span class="stat-icon">👍</span>{{ item.likeCount || 0 }}
              </span>
              <span class="stat-chip" title="评论数">
                <span class="stat-icon">💬</span>{{ item.commentCount || 0 }}
              </span>
              <span class="stat-chip" title="浏览数">
                <span class="stat-icon">👁</span>{{ item.viewCount || 0 }}
              </span>
            </div>
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
import { NButton, NInput, NSpace, NBreadcrumb, NBreadcrumbItem, NSpin, NEmpty, NSelect, NTabs, NTab } from 'naive-ui'
import { 
  apiGetFeedbackCategories, 
  apiGetFeedbackTags,
  apiPageFeedback,
  resolveFeedbackCategoryIcon,
  resolveFeedbackStatusText,
  resolveFeedbackErrorMessage
} from '~/composables/assistant'
import { sortFeedbackTags } from '~/composables/feedbackTag'
import { applyFeedbackInteractionPatches } from '~/composables/useFeedbackState'

const router = useRouter()
const message = useMessage()

const categories = ref([])
const feedbackTags = ref([])
const announcements = ref([])
const pinnedList = ref([])
const feedbackList = ref([])
const queryMode = ref('all')
const selectedCategoryId = ref(null)
const selectedTagIds = ref([])
// 默认选中「待处理」：用户进入列表通常关心未处理的反馈
const selectedStatus = ref('PENDING')
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
const queryModeOptions = [
  { label: '全部反馈', value: 'all' },
  { label: '我的反馈', value: 'mine' },
  { label: '我的收藏', value: 'favorite' }
]
const statusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'PROCESSING' },
  { label: '已解决', value: 'RESOLVED' },
  { label: '已关闭', value: 'CLOSED' }
]
const tagOptions = computed(() => feedbackTags.value.map(tag => ({
  label: tag.name,
  value: tag.id
})))
const showAnnouncements = computed(() => queryMode.value === 'all')
const emptyDescription = computed(() => {
  if (queryMode.value === 'mine') {
    return '暂无我的反馈'
  }
  if (queryMode.value === 'favorite') {
    return '暂无收藏反馈'
  }
  return '暂无反馈'
})
const hasMore = computed(() => (feedbackList.value.length + pinnedList.value.length) < total.value)

onMounted(() => {
  if (process.client) {
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
  }
  syncQueryModeFromRoute()
  loadCategories()
  loadTags()
  loadAnnouncements()
  loadFeedback()
})

onActivated(() => {
  syncQueryModeFromRoute()
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

async function loadTags() {
  try {
    const res = await apiGetFeedbackTags()
    feedbackTags.value = sortFeedbackTags(res.data || [])
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载标签失败'))
    console.error('加载标签失败:', error)
  }
}

async function loadAnnouncements() {
  try {
    // 公告独立于状态筛选展示，避免默认状态过滤掉公告
    const res = await apiPageFeedback({
      isAnnouncement: 1,
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
    if (showAnnouncements.value) {
      await loadAnnouncements()
      return
    }
    announcements.value = []
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

function syncQueryModeFromRoute() {
  const mode = router.currentRoute.value.query?.mode
  queryMode.value = queryModeOptions.some(option => option.value === mode) ? mode : 'all'
}

function selectQueryMode(mode) {
  if (queryMode.value === mode) {
    return
  }
  queryMode.value = mode
  router.replace({
    path: '/feedback/list',
    query: mode === 'all' ? {} : { mode }
  })
  loadFeedback()
}

function selectCategory(categoryId) {
  selectedCategoryId.value = categoryId
  loadFeedback()
}

function handleStatusChange() {
  loadFeedback()
}

function handleTagChange() {
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
    queryMode: queryMode.value,
    categoryId: selectedCategoryId.value,
    tagIds: selectedTagIds.value,
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

.view-mode-box {
  margin-bottom: 20px;
  border-bottom: 1px solid #eef0f3;
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
  padding: 14px 20px;
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
  flex-wrap: wrap;
}

.filter-search {
  flex: 1 1 280px;
  min-width: 220px;
}

.filter-control {
  flex: 0 0 auto;
}

.filter-tags {
  width: 200px;
}

.filter-status {
  width: 130px;
}

.filter-sort {
  width: 130px;
}

/* 类目筛选 chip */
.category-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  user-select: none;
}

.category-chip:hover {
  border-color: #c7d2fe;
  color: #1d4ed8;
}

.category-chip.is-active {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #fff;
}

.category-chip .chip-icon {
  font-size: 14px;
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
  display: flex;
  flex-direction: column;
  height: 232px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.feedback-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.feedback-card.pinned {
  border: 2px solid #ff9800;
  background: linear-gradient(135deg, #fff 0%, #fff8f0 100%);
  padding: 14px;
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
  flex-wrap: nowrap;
  gap: 6px;
  height: 24px;
  margin-bottom: 8px;
  overflow: hidden;
}

.category-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.category-name {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
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
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  height: 22px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  height: 22px;
  margin: 0 0 8px 0;
  overflow: hidden;
}

.feedback-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-content {
  flex: 1;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.55;
  margin: 0 0 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 0;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
}

.card-footer-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  height: 16px;
}

.footer-user {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-time {
  color: #9ca3af;
  flex-shrink: 0;
}

.card-footer-stats {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  height: 22px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.stat-chip .stat-icon {
  font-size: 12px;
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
