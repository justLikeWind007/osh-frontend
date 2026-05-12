<template>
  <div class="audit-page">
    <n-breadcrumb class="breadcrumb-wrapper">
      <n-breadcrumb-item><nuxt-link to="/">首页</nuxt-link></n-breadcrumb-item>
      <n-breadcrumb-item><nuxt-link to="/openproject/list">开源项目</nuxt-link></n-breadcrumb-item>
      <n-breadcrumb-item>审核管理</n-breadcrumb-item>
    </n-breadcrumb>

    <!-- 列表 -->
    <div class="records-list">
      <div class="record-header">
        <div class="header-item name-col">项目名称</div>
        <div class="header-item author-col">作者</div>
        <div class="header-item url-col">项目链接</div>
        <div class="header-item time-col">提交时间</div>
        <div class="header-item action-col">操作</div>
      </div>

      <div v-if="loading" class="empty-box"><n-spin size="large" /></div>
      <div v-else-if="list.length === 0" class="empty-box">
        <n-empty description="暂无待审核项目" />
      </div>

      <div
        v-for="item in list"
        :key="item.id"
        class="record-item"
        @click="openDetail(item)"
      >
        <div class="record-col name-col">{{ item.projectName }}</div>
        <div class="record-col author-col">{{ item.authorName || '-' }}</div>
        <div class="record-col url-col">
          <a :href="item.projectUrl" target="_blank" class="link-text" @click.stop>
            {{ item.projectUrl }}
          </a>
        </div>
        <div class="record-col time-col">{{ formatTime(item.createTime) }}</div>
        <div class="record-col action-col" @click.stop>
          <n-button size="small" type="success" @click="handlePass(item)">通过</n-button>
          <n-button size="small" type="error" style="margin-left:8px" @click="openReject(item)">拒绝</n-button>
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

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="drawerVisible" :width="560" placement="right">
      <n-drawer-content :title="drawerItem?.projectName || '项目详情'" closable>
        <template v-if="drawerItem">
          <!-- 基本信息 -->
          <div class="drawer-section">
            <div class="drawer-meta">
              <div class="dm-item">
                <span class="dm-label">作者</span>
                <span class="dm-value">{{ drawerItem.authorName || '-' }}</span>
              </div>
              <div class="dm-item">
                <span class="dm-label">提交时间</span>
                <span class="dm-value">{{ formatTime(drawerItem.createTime) }}</span>
              </div>
              <div class="dm-item">
                <span class="dm-label">项目链接</span>
                <a :href="drawerItem.projectUrl" target="_blank" class="dm-link">
                  {{ drawerItem.projectUrl }}
                </a>
              </div>
              <div class="dm-item" v-if="drawerItem.resources?.length">
                <span class="dm-label">关联资源</span>
                <div style="display:flex;flex-direction:column;gap:4px">
                  <span
                    v-for="res in drawerItem.resources"
                    :key="res.id"
                    class="dm-value"
                  >
                    [{{ resourceTypeLabel(res.resourceType) }}]
                    {{ res.resourceName || res.resourceUrl }}
                  </span>
                </div>
              </div>            </div>
          </div>

          <!-- 标签 -->
          <div class="drawer-section" v-if="drawerItem.tagNames?.length">
            <div class="drawer-section-title">标签</div>
            <div class="tag-row">
              <n-tag
                v-for="(name, idx) in drawerItem.tagNames"
                :key="idx"
                size="small"
                type="primary"
                style="margin-right:6px;margin-bottom:4px"
              >{{ name }}</n-tag>
            </div>
          </div>

          <!-- 项目描述 -->
          <div class="drawer-section">
            <div class="drawer-section-title">项目描述</div>
            <p class="drawer-desc">{{ drawerItem.projectDesc || '暂无描述' }}</p>
          </div>
        </template>

        <!-- 底部审核按钮 -->
        <template #footer>
          <n-space justify="end">
            <n-button @click="drawerVisible = false">关闭</n-button>
            <n-button type="error" @click="openReject(drawerItem); drawerVisible = false">拒绝</n-button>
            <n-button type="success" @click="handlePass(drawerItem); drawerVisible = false">通过</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 拒绝弹框 -->
    <n-modal
      v-model:show="rejectVisible"
      preset="dialog"
      title="拒绝原因"
      positive-text="确认拒绝"
      negative-text="取消"
      @positive-click="confirmReject"
      @negative-click="rejectVisible = false"
    >
      <n-input
        v-model:value="rejectReason"
        type="textarea"
        placeholder="请输入拒绝原因"
        :rows="4"
        style="margin-top:12px"
      />
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  NBreadcrumb, NBreadcrumbItem, NSpin, NEmpty, NPagination,
  NButton, NModal, NInput, NDrawer, NDrawerContent, NSpace, NTag,
  createDiscreteApi
} from 'naive-ui'

const { message } = createDiscreteApi(['message'])

const list        = ref([])
const loading     = ref(false)
const total       = ref(0)
const currentPage = ref(1)
const pageSize    = ref(10)

// 抽屉
const drawerVisible = ref(false)
const drawerItem    = ref(null)

// 拒绝弹框
const rejectVisible = ref(false)
const rejectReason  = ref('')
const rejectTarget  = ref(null)

const loadList = async () => {
  loading.value = true
  try {
    const res = await apiGetPendingOpenProjects({ pageNum: currentPage.value, pageSize: pageSize.value })
    const data = res?.data || res || {}
    list.value  = data.rows || []
    total.value = data.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// 点击行打开详情抽屉
function openDetail(item) {
  drawerItem.value = item
  drawerVisible.value = true
}

const handlePass = async (item) => {
  try {
    await apiAuditOpenProject({ id: item.id, status: 1 })
    message.success('已通过')
    list.value = list.value.filter(p => p.id !== item.id)
    total.value--
  } catch (e) {
    message.error(e?.data?.msg || '操作失败')
  }
}

const openReject = (item) => {
  rejectTarget.value = item
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    message.warning('请填写拒绝原因')
    return false
  }
  try {
    await apiAuditOpenProject({ id: rejectTarget.value.id, status: 2, rejectReason: rejectReason.value })
    message.success('已拒绝')
    list.value = list.value.filter(p => p.id !== rejectTarget.value.id)
    total.value--
    rejectVisible.value = false
  } catch (e) {
    message.error(e?.data?.msg || '操作失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadList()
}

function resourceTypeLabel(type) {
  const map = { course: '课程', book: '电子书', tool: '工具' }
  return map[type] || type
}

function formatTime(raw) {  if (!raw) return '-'
  try {
    const d = Array.isArray(raw)
      ? new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0)
      : new Date(raw)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch { return '-' }
}

onMounted(loadList)
</script>

<style scoped>
.audit-page { max-width: 1400px; margin: 0 auto; padding: 20px; }
.breadcrumb-wrapper { margin-bottom: 20px; }

.records-list {
  background: #fff; border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
}

.record-header {
  display: flex; align-items: center; height: 50px; padding: 0 20px;
  background: #f5f7fa; border-bottom: 1px solid #e8e8e8;
  font-size: 14px; font-weight: 600; color: #333;
}

.record-item {
  display: flex; align-items: center; min-height: 56px; padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0; transition: background 0.2s;
  cursor: pointer;
}
.record-item:last-child { border-bottom: none; }
.record-item:hover { background: #f0f5ff; }

.name-col   { width: 20%; }
.author-col { width: 12%; }
.url-col    { width: 30%; }
.time-col   { width: 20%; }
.action-col { width: 18%; }

.record-col {
  font-size: 13px; color: #333;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding-right: 8px;
}

.link-text {
  color: #4096ff; text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;
}
.link-text:hover { text-decoration: underline; }

.empty-box { display: flex; justify-content: center; align-items: center; height: 200px; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 24px; }

/* 抽屉内容 */
.drawer-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}
.drawer-section:last-child { border-bottom: none; }

.drawer-section-title {
  font-size: 13px; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.drawer-meta { display: flex; flex-direction: column; gap: 12px; }
.dm-item { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; }
.dm-label { color: #888; flex-shrink: 0; width: 72px; }
.dm-value { color: #333; }
.dm-link {
  color: #4096ff; text-decoration: none; word-break: break-all;
}
.dm-link:hover { text-decoration: underline; }

.tag-row { display: flex; flex-wrap: wrap; }

.drawer-desc {
  font-size: 14px; color: #444; line-height: 1.8;
  white-space: pre-wrap; margin: 0;
}
</style>
