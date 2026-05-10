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
        <n-breadcrumb-item>我的反馈</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="header-box">
      <h1 class="page-title">📝 我的反馈</h1>
      <n-button type="primary" @click="$router.push('/feedback/create')">
        ✍️ 提交新反馈
      </n-button>
    </div>

    <!-- 筛选器 -->
    <div class="filter-box">
      <n-space>
        <n-select
          v-model:value="filterCategoryId"
          :options="categoryOptions"
          placeholder="选择分类"
          clearable
          style="width: 150px"
          @update:value="handleFilter"
        />
        <n-input
          v-model:value="keyword"
          placeholder="搜索标题..."
          clearable
          style="width: 200px"
          @keyup.enter="handleFilter"
        >
          <template #suffix>
            <n-button text @click="handleFilter">
              🔍
            </n-button>
          </template>
        </n-input>
      </n-space>
    </div>

    <!-- 反馈列表 -->
    <div v-if="loading" class="loading-box">
      <n-spin size="large" />
    </div>
    <div v-else-if="feedbackList.length === 0" class="empty-box">
      <n-empty description="暂无反馈记录">
        <template #extra>
          <n-button type="primary" @click="$router.push('/feedback/create')">
            提交第一条反馈
          </n-button>
        </template>
      </n-empty>
    </div>
    <div v-else class="feedback-list">
      <div
        v-for="item in feedbackList"
        :key="item.id"
        class="feedback-item"
        @click="goToDetail(item.id)"
      >
        <div class="item-header">
          <div class="category">
            <span class="icon">{{ resolveFeedbackCategoryIcon(item) }}</span>
            <span class="name">{{ item.categoryName }}</span>
          </div>
          <div class="status" :class="`status-${item.status}`">
            {{ resolveFeedbackStatusText(item.status) }}
          </div>
        </div>
        
        <h3 class="item-title">{{ item.title }}</h3>
        
        <p class="item-content">{{ item.contentPreview || '' }}{{ item.contentPreview ? '...' : '' }}</p>
        
        <div class="item-footer">
          <span class="time">📅 {{ formatTime(item.createTime) }}</span>
          <span class="stats">
            💬 {{ item.commentCount }} · 👁 {{ item.viewCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-box">
      <n-pagination
        v-model:page="pageNum"
        :page-count="Math.ceil(total / pageSize)"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NButton,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NEmpty,
  NPagination,
  NBreadcrumb,
  NBreadcrumbItem
} from 'naive-ui'
import {
  apiGetFeedbackCategories,
  apiMyFeedback,
  resolveFeedbackCategoryIcon,
  resolveFeedbackErrorMessage,
  resolveFeedbackStatusText
} from '~/composables/assistant'
import { applyFeedbackInteractionPatches } from '~/composables/useFeedbackState'
import { useHasAuth } from '~/composables/useAuth'

const router = useRouter()
const message = useMessage()

const categories = ref([])
const feedbackList = ref([])
const filterCategoryId = ref(null)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const categoryOptions = computed(() => {
  return [
    { label: '全部分类', value: null },
    ...categories.value.map(cat => ({
      label: `${cat.icon} ${cat.name}`,
      value: cat.id
    }))
  ]
})

onMounted(async () => {
  useHasAuth()
  await loadCategories()
  await loadMyFeedback()
})

onActivated(() => {
  applyPatchedMyFeedback()
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

async function loadMyFeedback() {
  loading.value = true
  try {
    const res = await apiMyFeedback({
      categoryId: filterCategoryId.value,
      keyword: keyword.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    feedbackList.value = applyFeedbackInteractionPatches(res.rows || [])
    total.value = res.total || 0
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载失败'))
    console.error('加载我的反馈失败:', error)
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  pageNum.value = 1
  loadMyFeedback()
}

function handlePageChange() {
  loadMyFeedback()
}

function goToDetail(id) {
  router.push(`/feedback/detail/${id}`)
}

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function applyPatchedMyFeedback() {
  feedbackList.value = applyFeedbackInteractionPatches(feedbackList.value)
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
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-box {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.loading-box,
.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 0;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.feedback-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.feedback-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.category .icon {
  font-size: 16px;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-PENDING,
.status-submitted {
  background: #fff3e0;
  color: #f57c00;
}

.status-PROCESSING,
.status-triaged,
.status-in_progress {
  background: #e3f2fd;
  color: #1976d2;
}

.status-RESOLVED,
.status-resolved {
  background: #e8f5e9;
  color: #388e3c;
}

.status-CLOSED,
.status-closed,
.status-rejected {
  background: #f5f5f5;
  color: #757575;
}

.item-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-content {
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

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.pagination-box {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 12px;
  }
  
  .header-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .filter-box :deep(.n-space) {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-box :deep(.n-select),
  .filter-box :deep(.n-input) {
    width: 100% !important;
  }
}
</style>
