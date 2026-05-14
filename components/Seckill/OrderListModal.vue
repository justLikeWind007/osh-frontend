<template>
  <n-modal
    :show="show"
    title="秒杀订单管理"
    preset="card"
    style="width: 900px; max-width: 95vw;"
    :mask-closable="true"
    @update:show="$emit('update:show', $event)"
  >
    <!-- 筛选栏 -->
    <div class="filter-row">
      <n-input
        v-model:value="query.seckillNo"
        placeholder="订单编号"
        clearable
        style="width: 160px"
        @keyup.enter="load"
      />
      <n-select
        v-model:value="query.status"
        :options="statusOptions"
        placeholder="订单状态"
        clearable
        style="width: 120px"
      />
      <n-input-number
        v-model:value="query.activityId"
        placeholder="活动ID"
        clearable
        :min="1"
        style="width: 110px"
      />
      <n-input-number
        v-model:value="query.userId"
        placeholder="用户ID"
        clearable
        :min="1"
        style="width: 110px"
      />
      <n-button type="primary" @click="load" :loading="loading">
        <template #icon><span>🔍</span></template>
        查询
      </n-button>
      <n-button @click="resetQuery">重置</n-button>
    </div>

    <!-- 表格 -->
    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      :single-line="false"
      size="small"
      style="margin-top: 12px"
      @update:page="handlePageChange"
    />
  </n-modal>
</template>

<script setup>
import { NModal, NInput, NInputNumber, NSelect, NButton, NDataTable, NTag } from 'naive-ui'
import { h } from 'vue'

defineOptions({ ssr: false })

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

// ── 筛选 ──────────────────────────────────────────────────────
const defaultQuery = () => ({
  seckillNo: '',
  status: null,
  activityId: null,
  userId: null,
  pageNum: 1,
  pageSize: 10,
})
const query = reactive(defaultQuery())

function resetQuery() {
  Object.assign(query, defaultQuery())
  load()
}

const statusOptions = [
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已取消', value: 2 },
  { label: '已超时', value: 3 },
  { label: '已退款', value: 4 },
]

const statusMap = {
  0: { label: '待支付', type: 'warning' },
  1: { label: '已支付', type: 'success' },
  2: { label: '已取消', type: 'default' },
  3: { label: '已超时', type: 'error' },
  4: { label: '已退款', type: 'info' },
}

// ── 数据 ──────────────────────────────────────────────────────
const rows = ref([])
const total = ref(0)
const loading = ref(false)

const pagination = computed(() => ({
  page: query.pageNum,
  pageSize: query.pageSize,
  itemCount: total.value,
  showSizePicker: false,
  prefix: () => `共 ${total.value} 条`,
}))

async function load() {
  loading.value = true
  const q = { pageNum: query.pageNum, pageSize: query.pageSize }
  if (query.seckillNo) q.seckillNo = query.seckillNo
  if (query.status !== null && query.status !== undefined) q.status = query.status
  if (query.activityId) q.activityId = query.activityId
  if (query.userId) q.userId = query.userId

  const res = await fetchSeckillOrderList(q)
  rows.value = res?.rows || []
  total.value = res?.total || 0
  loading.value = false
}

function handlePageChange(page) {
  query.pageNum = page
  load()
}

// 弹窗打开时加载
watch(() => props.show, (val) => {
  if (val) {
    Object.assign(query, defaultQuery())
    load()
  }
})

// ── 表格列 ────────────────────────────────────────────────────
const columns = [
  {
    title: '订单编号',
    key: 'seckillNo',
    width: 180,
    render: row => h('span', { style: 'font-size:12px;color:#6b7280;font-family:monospace' }, row.seckillNo),
  },
  {
    title: '商品',
    key: 'goodsTitle',
    ellipsis: { tooltip: true },
    render: row => h('div', [
      h('div', { style: 'font-size:13px;font-weight:500;color:#111' }, row.goodsTitle),
      h('div', { style: 'font-size:11px;color:#9ca3af;margin-top:2px' },
        `${row.goodsType === 1 ? '课程' : '书籍'} · 活动#${row.activityId}`),
    ]),
  },
  {
    title: '价格',
    key: 'seckillPrice',
    width: 110,
    render: row => h('div', [
      h('div', { style: 'font-size:14px;font-weight:700;color:#e1251b' }, `¥${row.seckillPrice}`),
      h('div', { style: 'font-size:11px;color:#bbb;text-decoration:line-through' }, `¥${row.originPrice}`),
    ]),
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: row => {
      const s = statusMap[row.status] || { label: '未知', type: 'default' }
      return h(NTag, { type: s.type, size: 'small', round: true }, { default: () => s.label })
    },
  },
  {
    title: '用户ID',
    key: 'userId',
    width: 80,
    render: row => h('span', { style: 'font-size:12px;color:#6b7280' }, row.userId),
  },
  {
    title: '支付时间',
    key: 'payTime',
    width: 140,
    render: row => h('span', { style: 'font-size:12px;color:#374151' }, row.payTime || '—'),
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 140,
    render: row => h('span', { style: 'font-size:12px;color:#9ca3af' }, row.createTime),
  },
]
</script>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}
</style>
