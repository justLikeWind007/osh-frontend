<template>
  <div class="audit-page">
    <section class="audit-toolbar">
      <div>
        <h1 class="page-title">资源审核</h1>
        <p class="page-subtitle">按资源类型查看 status = 0 的待审核内容</p>
      </div>
      <div class="filters">
        <n-select
          v-model:value="query.resourceType"
          :options="resourceOptions"
          class="resource-select"
          @update:value="handleResourceChange"
        />
        <n-button type="primary" :loading="loading" @click="fetchList">查询</n-button>
      </div>
    </section>

    <section class="audit-table-panel">
      <n-data-table
        remote
        :loading="loading"
        :columns="columns"
        :data="rows"
        :pagination="pagination"
        :row-key="row => row.id"
        :scroll-x="1060"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </section>
  </div>
</template>

<script setup>
import { NButton, NDataTable, NSelect, NTag, NImage, NEllipsis, createDiscreteApi } from 'naive-ui';
import { h, onMounted, reactive, ref } from 'vue';

definePageMeta({
  name: 'audit',
});

useHead({ title: '审核 - 开源助手' });

const { message, dialog } = createDiscreteApi(['message', 'dialog']);

const resourceOptions = [
  { label: '课程', value: 'course' },
  { label: '答疑问题', value: 'qa_question' },
  { label: '答疑回答', value: 'qa_answer' },
  { label: '电子书', value: 'book' },
  { label: '工具', value: 'tool' },
  { label: '实用网站', value: 'website' },
];

const query = reactive({
  resourceType: 'course',
  pageNum: 1,
  pageSize: 10,
});
const rows = ref([]);
const loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`;
  },
});

const columns = computed(() => [
  {
    title: '资源',
    key: 'title',
    minWidth: 260,
    render(row) {
      return h('div', { class: 'resource-cell' }, [
        row.cover
          ? h(NImage, {
              src: row.cover,
              width: 44,
              height: 44,
              objectFit: 'cover',
              previewDisabled: true,
              class: 'resource-cover',
            })
          : h('div', { class: 'resource-cover placeholder' }, getResourceLabel(query.resourceType).slice(0, 1)),
        h('div', { class: 'resource-main' }, [
          h('div', { class: 'resource-title' }, row.title || `#${row.id}`),
          h(NEllipsis, { lineClamp: 2, class: 'resource-desc' }, {
            default: () => row.description || row.url || '-',
          }),
        ]),
      ]);
    },
  },
  {
    title: '类型',
    key: 'resourceType',
    width: 110,
    render() {
      return h(NTag, { type: 'info', bordered: false }, { default: () => getResourceLabel(query.resourceType) });
    },
  },
  {
    title: '等级',
    key: 'level',
    width: 90,
    render(row) {
      return row.level ?? '-';
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(NTag, { type: 'warning', bordered: false }, { default: () => `待审核(${row.status ?? 0})` });
    },
  },
  {
    title: '创建人',
    key: 'createBy',
    width: 120,
    render(row) {
      return row.createBy || '-';
    },
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return row.createTime || '-';
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render(row) {
      return h(NButton, {
        type: 'primary',
        size: 'small',
        onClick: () => confirmApprove(row),
      }, { default: () => '审核' });
    },
  },
]);

onMounted(() => {
  fetchList();
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await apiGetPendingAuditResources({
      resourceType: query.resourceType,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    });
    const data = res?.data || {};
    rows.value = data.rows || [];
    pagination.page = data.pageNum || query.pageNum;
    pagination.pageSize = data.pageSize || query.pageSize;
    pagination.itemCount = data.total || 0;
  } catch (error) {
    message.error(resolveErrorMessage(error, '加载待审核资源失败'));
  } finally {
    loading.value = false;
  }
}

function handleResourceChange() {
  query.pageNum = 1;
  pagination.page = 1;
  fetchList();
}

function handlePageChange(page) {
  query.pageNum = page;
  pagination.page = page;
  fetchList();
}

function handlePageSizeChange(pageSize) {
  query.pageNum = 1;
  query.pageSize = pageSize;
  pagination.page = 1;
  pagination.pageSize = pageSize;
  fetchList();
}

function confirmApprove(row) {
  dialog.warning({
    title: '审核确认',
    content: `确认通过「${row.title || row.id}」吗？`,
    positiveText: '通过',
    negativeText: '取消',
    onPositiveClick: () => approve(row),
  });
}

async function approve(row) {
  try {
    await apiApproveAuditResource({
      resourceType: query.resourceType,
      resourceId: row.id,
    });
    message.success('审核通过');
    fetchList();
  } catch (error) {
    message.error(resolveErrorMessage(error, '审核失败'));
  }
}

function getResourceLabel(resourceType) {
  const match = resourceOptions.find(item => item.value === resourceType);
  return match ? match.label : resourceType;
}

function resolveErrorMessage(error, fallback) {
  return error?.data?.msg || error?.data?.data || error?.message || fallback;
}
</script>

<style scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audit-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  line-height: 30px;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resource-select {
  width: 180px;
}

.audit-table-panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep(.resource-cell) {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

:deep(.resource-cover) {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.resource-cover.placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 700;
}

:deep(.resource-main) {
  min-width: 0;
}

:deep(.resource-title) {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

:deep(.resource-desc) {
  margin-top: 4px;
  max-width: 520px;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .audit-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters {
    width: 100%;
  }

  .resource-select {
    flex: 1;
    width: auto;
  }
}
</style>
