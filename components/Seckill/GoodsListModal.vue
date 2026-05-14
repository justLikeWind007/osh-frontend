<template>
  <n-modal
    :show="show"
    title="秒杀商品池管理"
    preset="card"
    style="width: 960px; max-width: 96vw;"
    :mask-closable="true"
    @update:show="$emit('update:show', $event)"
  >
    <!-- 筛选栏 -->
    <div class="filter-row">
      <n-input
        v-model:value="query.goodsName"
        placeholder="商品名称"
        clearable
        style="width: 160px"
        @keyup.enter="load"
      />
      <n-select
        v-model:value="query.status"
        :options="statusOptions"
        placeholder="上架状态"
        clearable
        style="width: 110px"
      />
      <n-button type="primary" :loading="loading" @click="load">
        <template #icon><span>🔍</span></template>
        查询
      </n-button>
      <n-button @click="resetQuery">重置</n-button>
      <div style="flex:1" />
      <n-button
        v-if="hasPermission('seckill:goods:add')"
        type="primary"
        @click="openAdd"
      >
        + 新增商品
      </n-button>
      <n-button
        v-if="hasPermission('seckill:goods:status') && selectedIds.length > 0"
        @click="handleBatchStatus(1)"
      >
        批量上架
      </n-button>
      <n-button
        v-if="hasPermission('seckill:goods:status') && selectedIds.length > 0"
        @click="handleBatchStatus(0)"
      >
        批量下架
      </n-button>
      <n-button
        v-if="hasPermission('seckill:goods:remove') && selectedIds.length > 0"
        type="error"
        @click="handleBatchDelete"
      >
        批量删除
      </n-button>
    </div>

    <!-- 表格 -->
    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :row-key="row => row.id"
      :checked-row-keys="selectedIds"
      :bordered="false"
      :single-line="false"
      size="small"
      style="margin-top: 12px"
      @update:checked-row-keys="selectedIds = $event"
      @update:page="handlePageChange"
    />

    <!-- 新增/编辑弹窗 -->
    <SeckillGoodsFormModal
      v-model:show="showFormModal"
      :init-data="editingGoods"
      @success="load"
    />
  </n-modal>
</template>

<script setup>
import { NModal, NInput, NSelect, NButton, NDataTable, NTag, createDiscreteApi } from 'naive-ui'
import { h } from 'vue'

defineOptions({ ssr: false })

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const { hasPermission } = usePermission()
const { seckillFetch } = useSeckillFetch()

// ── 筛选 ──────────────────────────────────────────────────────
const defaultQuery = () => ({
  goodsName: '',
  status: null,
  pageNum: 1,
  pageSize: 10,
})
const query = reactive(defaultQuery())

function resetQuery() {
  Object.assign(query, defaultQuery())
  load()
}

const statusOptions = [
  { label: '上架', value: 1 },
  { label: '下架', value: 0 },
]

const statusMap = {
  1: { label: '上架', type: 'success' },
  0: { label: '下架', type: 'default' },
}

// ── 数据 ──────────────────────────────────────────────────────
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const selectedIds = ref([])

const pagination = computed(() => ({
  page: query.pageNum,
  pageSize: query.pageSize,
  itemCount: total.value,
  showSizePicker: false,
  prefix: () => `共 ${total.value} 条`,
}))

async function load() {
  loading.value = true
  selectedIds.value = []
  try {
    const q = { pageNum: query.pageNum, pageSize: query.pageSize }
    if (query.goodsName) q.goodsName = query.goodsName
    if (query.status !== null && query.status !== undefined) q.status = query.status
    const res = await seckillFetch('/seckill/goods/list', { method: 'GET', query: q })
    rows.value = res?.rows || []
    total.value = res?.total || 0
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  query.pageNum = page
  load()
}

watch(() => props.show, (val) => {
  if (val) {
    Object.assign(query, defaultQuery())
    load()
  }
})

// ── 新增 / 编辑 ───────────────────────────────────────────────
const showFormModal = ref(false)
const editingGoods = ref(null)

function openAdd() {
  editingGoods.value = null
  showFormModal.value = true
}

function openEdit(row) {
  editingGoods.value = { ...row }
  showFormModal.value = true
}

// ── 单条上下架 ────────────────────────────────────────────────
async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const label = newStatus === 1 ? '上架' : '下架'
  try {
    const res = await seckillFetch('/seckill/goods/status', {
      method: 'POST',
      body: { ids: [row.id], status: newStatus },
    })
    if (res?.code === 200) {
      message.success(`${label}成功`)
      load()
    } else {
      message.error(res?.msg || `${label}失败`)
    }
  } catch {
    message.error(`${label}失败`)
  }
}

// ── 批量上下架 ────────────────────────────────────────────────
async function handleBatchStatus(status) {
  if (!selectedIds.value.length) return
  const label = status === 1 ? '上架' : '下架'
  try {
    const res = await seckillFetch('/seckill/goods/status', {
      method: 'POST',
      body: { ids: selectedIds.value, status },
    })
    if (res?.code === 200) {
      message.success(`批量${label}成功`)
      load()
    } else {
      message.error(res?.msg || `批量${label}失败`)
    }
  } catch {
    message.error(`批量${label}失败`)
  }
}

// ── 单条删除 ──────────────────────────────────────────────────
async function handleDelete(row) {
  const confirmed = await new Promise(resolve => {
    dialog.error({
      title: '删除商品',
      content: `确认删除「${row.goodsName}」？此操作不可恢复。`,
      positiveText: '确认删除',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
  if (!confirmed) return
  try {
    const res = await seckillFetch(`/seckill/goods/batch?ids=${row.id}`, { method: 'DELETE' })
    if (res?.code === 200) {
      message.success('删除成功')
      load()
    } else {
      message.error(res?.msg || '删除失败')
    }
  } catch {
    message.error('删除失败')
  }
}

// ── 批量删除 ──────────────────────────────────────────────────
async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  const confirmed = await new Promise(resolve => {
    dialog.error({
      title: '批量删除',
      content: `确认删除选中的 ${selectedIds.value.length} 个商品？此操作不可恢复。`,
      positiveText: '确认删除',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
  if (!confirmed) return
  try {
    const params = selectedIds.value.map(id => `ids=${id}`).join('&')
    const res = await seckillFetch(`/seckill/goods/batch?${params}`, { method: 'DELETE' })
    if (res?.code === 200) {
      message.success(res.msg || '删除成功')
      load()
    } else {
      message.error(res?.msg || '删除失败')
    }
  } catch {
    message.error('删除失败')
  }
}

// ── 表格列 ────────────────────────────────────────────────────
const columns = computed(() => {
  const cols = [
    {
      type: 'selection',
      disabled: () => !hasPermission('seckill:goods:remove') && !hasPermission('seckill:goods:status'),
    },
    {
      title: 'ID',
      key: 'id',
      width: 60,
      render: row => h('span', { style: 'font-size:12px;color:#9ca3af' }, row.id),
    },
    {
      title: '商品名称',
      key: 'goodsName',
      ellipsis: { tooltip: true },
      render: row => h('div', [
        h('div', { style: 'font-size:13px;font-weight:500;color:#111' }, row.goodsName),
        row.courseName
          ? h('div', { style: 'font-size:11px;color:#9ca3af;margin-top:2px' }, `课程：${row.courseName}`)
          : null,
      ]),
    },
    {
      title: '原价',
      key: 'originalPrice',
      width: 90,
      render: row => h('span', { style: 'font-size:13px;color:#6b7280;text-decoration:line-through' }, `¥${row.originalPrice}`),
    },
    {
      title: '秒杀价',
      key: 'seckillPrice',
      width: 90,
      render: row => h('span', { style: 'font-size:14px;font-weight:700;color:#e1251b' }, `¥${row.seckillPrice}`),
    },
    {
      title: '库存/已售',
      key: 'stock',
      width: 90,
      render: row => h('span', { style: 'font-size:12px;color:#374151' }, `${row.stock} / ${row.soldCount ?? 0}`),
    },
    {
      title: '状态',
      key: 'status',
      width: 70,
      render: row => {
        const s = statusMap[row.status] ?? { label: '未知', type: 'default' }
        return h(NTag, { type: s.type, size: 'small', round: true }, { default: () => s.label })
      },
    },
    {
      title: '秒杀时间',
      key: 'startTime',
      width: 200,
      render: row => h('div', [
        h('div', { style: 'font-size:11px;color:#374151' }, row.startTime || '—'),
        h('div', { style: 'font-size:11px;color:#9ca3af' }, row.endTime || ''),
      ]),
    },
  ]

  // 操作列：有任意操作权限才显示
  if (
    hasPermission('seckill:goods:edit') ||
    hasPermission('seckill:goods:status') ||
    hasPermission('seckill:goods:remove')
  ) {
    cols.push({
      title: '操作',
      key: 'actions',
      width: 150,
      render: row => {
        const btns = []
        if (hasPermission('seckill:goods:edit')) {
          btns.push(
            h('button', {
              class: 'tbl-btn tbl-btn-edit',
              onClick: () => openEdit(row),
            }, '编辑')
          )
        }
        if (hasPermission('seckill:goods:status')) {
          btns.push(
            h('button', {
              class: row.status === 1 ? 'tbl-btn tbl-btn-offline' : 'tbl-btn tbl-btn-online',
              onClick: () => handleToggleStatus(row),
            }, row.status === 1 ? '下架' : '上架')
          )
        }
        if (hasPermission('seckill:goods:remove')) {
          btns.push(
            h('button', {
              class: 'tbl-btn tbl-btn-delete',
              onClick: () => handleDelete(row),
            }, '删除')
          )
        }
        return h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, btns)
      },
    })
  }

  return cols
})
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

.tbl-btn {
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  background: #fff;
  transition: all 0.15s;
}
.tbl-btn-edit    { border-color: #0ea5e9; color: #0ea5e9; }
.tbl-btn-edit:hover    { background: #0ea5e9; color: #fff; }
.tbl-btn-online  { border-color: #22c55e; color: #22c55e; }
.tbl-btn-online:hover  { background: #22c55e; color: #fff; }
.tbl-btn-offline { border-color: #f59e0b; color: #f59e0b; }
.tbl-btn-offline:hover { background: #f59e0b; color: #fff; }
.tbl-btn-delete  { border-color: #ef4444; color: #ef4444; }
.tbl-btn-delete:hover  { background: #ef4444; color: #fff; }
</style>
