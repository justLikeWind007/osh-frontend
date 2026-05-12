<template>
  <div class="open-project-page">
    <n-breadcrumb class="breadcrumb-wrapper">
      <n-breadcrumb-item><nuxt-link to="/">首页</nuxt-link></n-breadcrumb-item>
      <n-breadcrumb-item>开源项目</n-breadcrumb-item>
    </n-breadcrumb>

    <OpenProjectSearch :tag-options="tagOptions" @search="handleSearch" />

    <!-- 新项目广播公告栏 -->
    <OpenProjectAnnouncementBar />

    <div class="page-layout">
      <!-- 左侧：项目列表 -->
      <div class="list-area">
        <div class="content-area">
          <div v-if="loading" class="empty-box"><n-spin size="large" /></div>
          <div v-else-if="projectList.length === 0" class="empty-box">
            <n-empty description="暂无开源项目" />
          </div>
          <div v-else class="project-grid">
        <div
          v-for="item in projectList"
          :key="item.id"
          class="project-card"
          :class="{ archived: item.isArchived === 1, expanded: expandedId === item.id }"
        >
          <!-- 卡片主体（点击展开/收起） -->
          <div class="card-inner" @click="toggleExpand(item)">
            <div class="card-header">
              <div class="title-row">
                <span class="project-title">{{ item.projectName }}</span>
                <div class="title-right">
                  <n-tag v-if="item.isArchived === 1" size="small" type="warning">已归档</n-tag>
                  <span class="expand-icon" :class="{ open: expandedId === item.id }">▾</span>
                </div>
              </div>
              <div class="project-tags">
                <n-tag
                  v-for="(tagName, idx) in item.tagNames"
                  :key="idx"
                  size="small"
                  type="primary"
                  class="project-tag"
                >{{ tagName }}</n-tag>
              </div>
            </div>

            <div class="card-body">
              <p class="project-desc">{{ item.projectDesc || '暂无描述' }}</p>
              <div class="github-stats">
                <span class="stat-item"><StarIcon />{{ item.starCount ?? '-' }}</span>
                <span class="stat-item"><ForkIcon />{{ item.forkCount ?? '-' }}</span>
                <span v-if="item.lastCommitTime" class="stat-item last-commit">
                  最近提交：{{ formatDate(item.lastCommitTime) }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="author-info">
                <n-avatar :size="24" :src="item.projectCover || defaultCover" />
                <span class="author-name">{{ item.authorName || '匿名' }}</span>
              </div>
              <div class="footer-right">
                <n-button
                  text
                  size="small"
                  :style="{ color: item.favorited ? '#f59e0b' : '#9ca3af' }"
                  @click.stop="toggleFavorite(item)"
                  :title="item.favorited ? '取消收藏' : '收藏'"
                >
                  {{ item.favorited ? '⭐' : '☆' }}
                </n-button>
              </div>
            </div>
          </div>

          <!-- 展开的详情区域 -->
          <Transition name="expand">
            <div v-if="expandedId === item.id" class="card-detail">
              <div class="detail-loading" v-if="detailLoading">
                <n-spin size="small" /> 加载中…
              </div>
              <template v-else-if="detailData">
                <div class="detail-grid">
                  <!-- 左：完整描述 -->
                  <div class="detail-main">
                    <div class="detail-section-title">项目介绍</div>
                    <p class="detail-desc">{{ detailData.projectDesc || '暂无详细介绍' }}</p>
                  </div>

                  <!-- 右：元信息 -->
                  <div class="detail-side">
                    <div class="detail-meta">
                      <div class="dm-row">
                        <span class="dm-label">作者</span>
                        <span class="dm-value">{{ detailData.authorName || '-' }}</span>
                      </div>
                      <div class="dm-row">
                        <span class="dm-label">状态</span>
                        <n-tag :type="detailData.isArchived === 1 ? 'warning' : 'success'" size="small">
                          {{ detailData.isArchived === 1 ? '已归档' : '活跃维护' }}
                        </n-tag>
                      </div>
                      <div class="dm-row">
                        <span class="dm-label">⭐ Star</span>
                        <span class="dm-value star">{{ detailData.starCount ?? '-' }}</span>
                      </div>
                      <div class="dm-row">
                        <span class="dm-label">🍴 Fork</span>
                        <span class="dm-value">{{ detailData.forkCount ?? '-' }}</span>
                      </div>
                      <div class="dm-row" v-if="detailData.lastCommitTime">
                        <span class="dm-label">最近提交</span>
                        <span class="dm-value">{{ formatDate(detailData.lastCommitTime) }}</span>
                      </div>
                      <div class="dm-row" v-if="detailData.lastSyncTime">
                        <span class="dm-label">数据同步</span>
                        <span class="dm-value muted">{{ formatDate(detailData.lastSyncTime) }}</span>
                      </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="detail-actions">
                      <n-button type="primary" size="small" @click.stop="goGithub(detailData)">
                        访问 GitHub
                      </n-button>
                      <template v-if="detailData.resources?.length">
                        <n-button
                          v-for="res in detailData.resources"
                          :key="res.id"
                          :type="res.resourceType === 'course' ? 'success' : res.resourceType === 'book' ? 'info' : 'default'"
                          size="small"
                          @click.stop="navigateTo(res.resourceUrl)"
                        >
                          {{ resourceLabel(res.resourceType) }}{{ res.resourceName ? '：' + res.resourceName : '' }}
                        </n-button>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="total > 0">
      <n-pagination
        :page-count="Math.ceil(total / pageSize)"
        :page="currentPage"
        @update:page="handlePageChange"
      />
    </div>
      </div>

      <!-- 右侧：排行榜 -->
      <div class="rank-area">
        <OpenProjectRankBoard @select="handleRankSelect" />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  NBreadcrumb, NBreadcrumbItem, NAvatar, NButton,
  NEmpty, NPagination, NSpin, NTag
} from 'naive-ui'
import { ref, onMounted, h } from 'vue'

const defaultCover = 'https://picsum.photos/200/200'

const projectList  = ref([])
const tagOptions   = ref([])
const loading      = ref(false)
const total        = ref(0)
const currentPage  = ref(1)
const pageSize     = ref(10)
const searchParams = ref({})

// 展开状态
const expandedId   = ref(null)
const detailData   = ref(null)
const detailLoading = ref(false)

// ── 图标 ──────────────────────────────────────────────────────────────────────
const StarIcon = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor', style: 'margin-right:3px;color:#f59e0b' }, [
  h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
])
const ForkIcon = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', style: 'margin-right:3px;color:#6b7280' }, [
  h('circle', { cx: '6', cy: '6', r: '2' }),
  h('circle', { cx: '18', cy: '6', r: '2' }),
  h('circle', { cx: '12', cy: '18', r: '2' }),
  h('path', { d: 'M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8' }),
  h('line', { x1: '12', y1: '14', x2: '12', y2: '16' })
])

// ── 展开/收起 ─────────────────────────────────────────────────────────────────
async function toggleExpand(item) {
  if (expandedId.value === item.id) {
    // 已展开 → 收起
    expandedId.value = null
    detailData.value = null
    return
  }
  // 展开新卡片
  expandedId.value = item.id
  detailData.value = null
  detailLoading.value = true
  try {
    const res = await apiGetOpenProjectDetail(item.id)
    detailData.value = res?.data || res || null
  } catch {
    detailData.value = item  // 降级：用列表数据
  } finally {
    detailLoading.value = false
  }
}

async function goGithub(item) {
  if (!item?.projectUrl) return
  await apiClickOpenProject(item.id).catch(() => {})
  window.open(item.projectUrl, '_blank')
}

async function toggleFavorite(item) {
  try {
    if (item.favorited) {
      await apiCancelFavoriteOpenProject(item.id)
      item.favorited = false
    } else {
      await apiFavoriteOpenProject(item.id)
      item.favorited = true
    }
  } catch (e) {
    console.error('[Favorite] 操作失败', e)
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
const loadTags = async () => {
  try {
    const res = await apiGetOpenProjectTags()
    const tags = res?.data || res || []
    tagOptions.value = tags.map(t => ({ label: t.tagName, value: t.id }))
  } catch {}
}

const loadList = async () => {
  loading.value = true
  expandedId.value = null
  detailData.value = null
  try {
    const res = await apiGetOpenProjectList({
      ...searchParams.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })
    const data = res?.data || res || {}
    projectList.value = data.rows || []
    total.value = data.total || 0
  } catch {
    projectList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  searchParams.value = params
  currentPage.value = 1
  loadList()
}

// 点击排行榜条目，展开对应项目
function handleRankSelect(rankItem) {
  const found = projectList.value.find(p => p.id === rankItem.id)
  if (found) {
    toggleExpand(found)
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadList()
}

function resourceLabel(type) {
  const map = { course: '查看课程', book: '查看电子书', tool: '查看工具' }
  return map[type] || '查看资源'
}

function formatDate(raw) {  if (!raw) return ''
  try {
    const d = Array.isArray(raw)
      ? new Date(raw[0], raw[1] - 1, raw[2])
      : new Date(raw)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  } catch { return '' }
}

onMounted(() => {
  loadTags()
  loadList()
})
</script>

<style scoped>
.open-project-page { max-width: 1400px; margin: 0 auto; padding: 20px; }
.breadcrumb-wrapper { margin-bottom: 20px; }

/* 左右布局 */
.page-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1024px) {
  .page-layout { grid-template-columns: 1fr; }
  .rank-area { order: -1; }
}

.list-area { min-width: 0; }
.rank-area { position: sticky; top: 80px; }

.content-area { min-height: 400px; }
.empty-box { display: flex; justify-content: center; align-items: center; height: 300px; }

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

/* 展开的卡片占满整行 */
.project-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  background: #fff;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
  overflow: hidden;
}
.project-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.09); border-color: #d0d7de; }
.project-card.expanded {
  grid-column: 1 / -1;   /* 展开时占满整行 */
  border-color: #4096ff;
  box-shadow: 0 4px 16px rgba(64,150,255,0.15);
}
.project-card.archived { opacity: 0.75; }

.card-inner { display: flex; flex-direction: column; }

.card-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex; flex-direction: column; gap: 8px;
}
.title-row { display: flex; align-items: center; justify-content: space-between; }
.title-right { display: flex; align-items: center; gap: 8px; }
.project-title { font-size: 16px; font-weight: 600; color: #333; }
.expand-icon {
  font-size: 18px; color: #aaa; transition: transform 0.25s ease; line-height: 1;
}
.expand-icon.open { transform: rotate(180deg); color: #4096ff; }
.project-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.project-tag { margin: 0; }

.card-body { padding: 14px 16px; }
.project-desc {
  font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.github-stats { display: flex; align-items: center; gap: 16px; font-size: 13px; color: #555; }
.stat-item { display: flex; align-items: center; }
.last-commit { color: #9ca3af; font-size: 12px; }

.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-top: 1px solid #f0f0f0; background: #fafafa;
}
.author-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.author-name { color: #666; }
.footer-right { display: flex; align-items: center; gap: 4px; }

/* 展开详情区 */
.card-detail {
  border-top: 1px solid #e8f0fe;
  background: #f8fbff;
  padding: 20px;
}
.detail-loading { display: flex; align-items: center; gap: 8px; color: #888; font-size: 13px; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
}
@media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } }

.detail-section-title {
  font-size: 12px; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;
}
.detail-desc { font-size: 14px; color: #444; line-height: 1.8; white-space: pre-wrap; margin: 0; }

.detail-meta { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.dm-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.dm-label { color: #888; }
.dm-value { color: #333; font-weight: 500; }
.dm-value.star { color: #f59e0b; }
.dm-value.muted { color: #9ca3af; }

.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* 展开动画 */
.expand-enter-active, .expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.25s ease;
  max-height: 600px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.pagination-wrapper { display: flex; justify-content: center; margin-top: 40px; }
</style>
