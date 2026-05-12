<template>
  <div class="compact-filter">
    <!-- 第一行：搜索 + 操作按钮 -->
    <n-space align="center" justify="space-between" style="margin-bottom: 12px">
      <n-space>
        <n-select
          v-model:value="queryParams.tagIds"
          multiple
          filterable
          placeholder="按标签筛选（可多选）"
          :options="tagOptions"
          style="width: 260px"
          @update:value="handleSearch"
        />
        <n-input
          v-model:value="queryParams.keyword"
          placeholder="搜索项目名称或描述..."
          style="width: 220px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix><n-icon><SearchOutline /></n-icon></template>
        </n-input>
        <n-button
          :type="queryParams.onlyFavorite ? 'warning' : 'default'"
          @click="toggleFavorite"
        >
          {{ queryParams.onlyFavorite ? '⭐ 我收藏的' : '☆ 我收藏的' }}
        </n-button>
      </n-space>

      <n-space>
        <n-button v-if="canAudit" @click="goToAudit">审核管理</n-button>
        <n-button v-if="canSubmit" type="primary" @click="goToCreate">新增开源项目</n-button>
      </n-space>
    </n-space>

    <!-- 第二行：排序按钮组 -->
    <n-space align="center">
      <span style="font-size:13px;color:#666">排序：</span>
      <n-button-group>
        <n-button
          v-for="opt in sortOptions"
          :key="opt.field"
          size="small"
          :type="queryParams.sortField === opt.field ? 'primary' : 'default'"
          @click="toggleSort(opt.field)"
        >
          {{ opt.label }}
          <template v-if="queryParams.sortField === opt.field">
            {{ queryParams.sortOrder === 'desc' ? ' ↓' : ' ↑' }}
          </template>
        </n-button>
      </n-button-group>
    </n-space>
  </div>
</template>

<script setup>
import { NInput, NSelect, NSpace, NButton, NButtonGroup, NIcon } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { reactive, computed } from 'vue'

const props = defineProps({
  tagOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['search'])

const queryParams = reactive({
  keyword: '',
  tagIds: [],
  sortField: 'star_count',
  sortOrder: 'desc',
  onlyFavorite: false,
})

const sortOptions = [
  { field: 'star_count',       label: 'Star' },
  { field: 'fork_count',       label: 'Fork' },
  { field: 'last_commit_time', label: '最近提交' },
]

function toggleSort(field) {
  if (queryParams.sortField === field) {
    queryParams.sortOrder = queryParams.sortOrder === 'desc' ? 'asc' : 'desc'
  } else {
    queryParams.sortField = field
    queryParams.sortOrder = 'desc'
  }
  emit('search', { ...queryParams })
}

function toggleFavorite() {
  queryParams.onlyFavorite = !queryParams.onlyFavorite
  emit('search', { ...queryParams })
}

const handleSearch = () => emit('search', { ...queryParams })

const { hasPermission } = usePermission()
const canSubmit = computed(() => hasPermission('op:submit'))
const canAudit  = computed(() => hasPermission('op:audit'))

function goToCreate() { navigateTo('/openproject/create') }
function goToAudit()  { navigateTo('/openproject/audit') }
</script>

<style scoped>
.compact-filter {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #eee;
  margin-bottom: 24px;
}
</style>
