<template>
  <div class="info-gap-container">
    <n-alert title="平台风险公告" type="warning" class="notice-bar">
      不良信息、恶法内容将被加入页面名单，严重者封封！警告三次将永久封禁账号！
    </n-alert>

    <div class="top-toolbar">
      <n-space align="center" justify="space-between" style="width: 100%">
        <n-space>
          <n-button type="primary" @click="handlePublish">
            <template #icon>
              <n-icon><Add /></n-icon>
            </template>
            发布我的信息差
          </n-button>
          <n-input-group style="width: 300px">
            <n-input
              v-model:value="queryParams.title"
              placeholder="搜索信息差..."
              clearable
              @keyup.enter="handleSearch"
            />
            <n-button ghost @click="handleSearch">
              <template #icon>
                <n-icon><SearchOutline /></n-icon>
              </template>
            </n-button>
          </n-input-group>
        </n-space>

        <n-radio-group
          v-model:value="queryParams.type"
          name="tab-group"
          size="medium"
          @update:value="handleTypeChange"
        >
          <n-radio-button value="hot">
            <n-icon :style="{ color: queryParams.type === 'hot' ? '#111827' : '#6366f1' }">
              <component :is="queryParams.type === 'hot' ? FlameSharp : FlameOutline" />
            </n-icon> 热门信息差
          </n-radio-button>

          <n-radio-button value="latest">
            <n-icon :style="{ color: queryParams.type === 'latest' ? '#111827' : '#6366f1' }">
              <component :is="queryParams.type === 'latest' ? StarSharp : StarOutline" />
            </n-icon>
            最新发布
          </n-radio-button>

          <n-radio-button value="myself">
            <n-icon :style="{ color: queryParams.type === 'myself' ? '#111827' : '#6366f1' }">
              <component :is="queryParams.type === 'myself' ? PersonSharp : PersonOutline" />
            </n-icon>
            我发布的
          </n-radio-button>

          <n-radio-button value="follow">
            <n-icon :style="{ color: queryParams.type === 'follow' ? '#111827' : '#6366f1' }">
              <component :is="queryParams.type === 'follow' ? Bookmark : BookmarkOutline" />
            </n-icon>
            我收藏的
          </n-radio-button>
        </n-radio-group>
      </n-space>
    </div>

    <n-grid :x-gap="20">
      <n-grid-item :span="18">
        <LoadingGroup
          :pending="pending"
          :error="error"
          :is-empty="rows.length === 0"
        >
          <div class="list-wrapper">
            <div
              v-for="item in rows"
              :key="item.id"
              class="info-item-row-card"
              :class="{ 'is-active': item.isExpanded }"
            >
              <div class="feed-card-body">
                <div class="feed-main-area" @click="toggleExpand(item)">
                  <div class="feed-title-row" >
                    <div class="feed-title-main">
                      <span class="feed-tag">[{{ item.tag }}]</span>
                      <span class="feed-title">{{ item.title }}</span>
                      <div v-if="item.searchTags?.length" class="feed-tag-actions">
                        <button
                          v-for="tag in item.searchTags"
                          :key="`${item.id}-${tag.id ?? tag.label}`"
                          type="button"
                          class="feed-search-tag-button"
                          @click.stop="handleTagSearch(tag)"
                        >
                          {{ tag.label }}
                        </button>
                      </div>
                    </div>
                    <div v-if="queryParams.type === 'myself'" class="feed-more-actions">
                      <n-popover trigger="hover" placement="bottom-end">
                        <template #trigger>
                          <button
                            type="button"
                            class="feed-more-button"
                            @click.stop
                          >
                            更多
                          </button>
                        </template>
                        <div class="feed-more-menu">
                          <button
                            type="button"
                            class="feed-more-menu-item"
                            @click.stop="handleEditInfoGap(item)"
                          >
                            修改
                          </button>
                          <button
                            type="button"
                            class="feed-more-menu-item danger"
                            @click.stop="handleDeleteInfoGap(item)"
                          >
                            删除
                          </button>
                        </div>
                      </n-popover>
                    </div>
                  </div>

                  <transition name="expand">
                    <div v-if="item.isExpanded" class="detail-content-area">
                      <div class="content-text">
                        {{ item.content }}
                      </div>
                    </div>
                  </transition>
                </div>

                <div class="feed-stats">
                  <span class="feed-stat">
                    <span class="stat-icon">◉</span>
                    阅读 {{ item.readCount || item.viewCount || 0 }}
                  </span>

                  <span
                    class="feed-stat clickable"
                    :style="{ color: item.isVoted === 1 ? '#111827' : '#98a2b3' }"
                    @click.stop="handleVote(item, 1)"
                  >
                    <n-icon class="stat-icon">
                      <component :is="item.isVoted === 1 ? ThumbsUpSharp : ThumbsUpOutline" />
                    </n-icon>
                    {{ item.goodCount || 0 }}
                  </span>

                  <span
                    class="feed-stat clickable"
                    :style="{ color: item.isVoted === 2 ? '#111827' : '#98a2b3' }"
                    @click.stop="handleVote(item, 2)"
                  >
                    <n-icon class="stat-icon">
                      <component :is="item.isVoted === 2 ? PauseCircleSharp : PauseCircleOutline" />
                    </n-icon>
                    {{ item.middleCount || 0 }}
                  </span>

                  <span
                    class="feed-stat clickable"
                    :style="{ color: item.isVoted === 3 ? '#111827' : '#98a2b3' }"
                    @click.stop="handleVote(item, 3)"
                  >
                    <n-icon class="stat-icon">
                      <component :is="item.isVoted === 3 ? ThumbsDownSharp : ThumbsDownOutline" />
                    </n-icon>
                    {{ item.badCount || 0 }}
                  </span>

                  <span
                    class="feed-stat clickable"
                    :style="{ color: item.isFollowed ? '#111827' : '#98a2b3' }"
                    @click.stop="handleFollow(item)"
                  >
                    <n-icon class="stat-icon">
                      <component :is="item.isFollowed ? Bookmark : BookmarkOutline" />
                    </n-icon>
                    {{ item.collectCount || 0 }}
                  </span>

                  <span class="feed-publisher">
                    <n-icon><PersonOutline /></n-icon>
                    {{ item.nickname || '匿名用户' }}
                  </span>

                  <span class="feed-publisher">
                    <n-icon><TimeOutline /></n-icon>
                    {{ formatTime(item.updateTime) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-wrapper">
            <n-pagination
              v-model:page="queryParams.pageNum"
              :item-count="total"
              :page-size="queryParams.pageSize"
              @update:page="handlePageChange"
            />
          </div>
        </LoadingGroup>
      </n-grid-item>

      <n-grid-item :span="6">
        <InfoGapHotList />
      </n-grid-item>
    </n-grid>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEditMode ? '修改信息差' : '发布我的信息差'"
      style="width: 600px"
    >
      <n-form :model="form">
        <n-form-item label="标题">
          <n-input
            v-model:value="form.title"
            placeholder="一句话概括你的信息差"
          />
        </n-form-item>
        <n-form-item label="信息差分类">
          <n-select
            v-model:value="form.tag"
            :options="[
              { label: '技术', value: '技术' },
              { label: '政策', value: '政策' },
              { label: '搞钱', value: '搞钱' },
            ]"
          />
        </n-form-item>
        <n-form-item label="内容详情">
          <n-input
            v-model:value="form.content"
            type="textarea"
            placeholder="请详细描述..."
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </n-form-item>

        <n-form-item label-width="220">
          <template #label>
            <div class="tag-label">
              <span>标签选择</span>
              <span class="tag-count"
                >已选 {{ selectedTags.length }}/{{ MAX_TAG_COUNT }}</span
              >
            </div>
          </template>
          <n-space :size="8" wrap>
            <n-tag
              v-for="tag in candidateTags"
              :key="tag"
              size="large"
              round
              :type="isTagSelected(tag) ? 'success' : 'default'"
              :bordered="!isTagSelected(tag)"
              :closable="isTagSelected(tag)"
              :style="{
                cursor:
                  isTagSelected(tag) || selectedTags.length < MAX_TAG_COUNT
                    ? 'pointer'
                    : 'not-allowed',
                opacity:
                  isTagSelected(tag) || selectedTags.length < MAX_TAG_COUNT
                    ? 1
                    : 0.5,
              }"
              @click="handleTagClick(tag)"
              @close="handleTagClose(tag, $event)"
            >
              {{ tag.name }}
            </n-tag>
          </n-space>
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button v-if="!isEditMode" type="warning" @click="resetPublishForm">重置</n-button>
          <n-button @click="showModal=false">取消</n-button>
          <n-button type="primary" :loading="btnLoading" @click="confirmPublish">
            {{ isEditMode ? '确认修改' : '确认发布' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<!-- 样式实时切换 暂时搞不出来 算了 TODO -->

<script setup>
// ==================== 1) 依赖导入 ====================
import {
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NIcon,
  NPagination,
  NInput,
  NInputGroup,
  NAlert,
  NRadioGroup,
  NRadioButton,
  NTooltip,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NTag,
  NPopover,
  createDiscreteApi,
} from 'naive-ui';
import {
  PersonOutline,
  TimeOutline,
  ArrowForward,
  ChevronForwardOutline,
  SearchOutline,
  Add,
  FlashOutline,
  StarOutline,
  StarSharp,
  Bookmark,
  BookmarkOutline,
  BuildOutline,
  FlashSharp,
  ThumbsUpOutline,
  ThumbsUpSharp,
  RemoveCircleOutline,
  RemoveCircleSharp,
  ThumbsDownOutline,
  ThumbsDownSharp, PauseCircleOutline, PauseCircleSharp, FlameSharp, FlameOutline, PersonSharp,
} from '@vicons/ionicons5';
import InfoGapHotList from "~/components/InfoGapHotList.vue";

// ==================== 2) 页面状态 ====================
// 路由对象：用于读取 page 参数和 query 参数
const route = useRoute();

// 列表查询参数：同时驱动 UI、URL 和后端请求
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  type: 'hot', // 排序：hot, latest, follow
  title: '', // 搜索词
});

// 发布弹窗相关状态
const showModal = ref(false);
const btnLoading = ref(false);
const isEditMode = ref(false);
const editingInfoGapId = ref(null);
const form = reactive({
  title: '',
  tag: '技术',
  content: '',
  tags: [],
});

// 列表请求状态
const pending = ref(false);
const error = ref(null);
const total = ref(0);
const rows = ref([]);
const activeSearchTagId = ref(null);
const isSearchMode = ref(false);

// 发布信息差表格中标签相关内容
const MAX_TAG_COUNT = 3;
const selectedTags = ref([]);

const candidateTags = ref([
  { id: 116, name: "Mysql" },
  { id: 115, name: "Redis" },
  { id: 114, name: "Go" },
  { id: 117, name: "SpringBoot" },
  { id: 119, name: "Nginx" },
  { id: 113, name: "Java" },
  { id: 121, name: "ElasticSearch" },
  { id: 120, name: "K8s" },
  { id: 122, name: "Mybatis" },
  { id: 118, name: "Docker" },
]);

const normalizeSearchKeyword = (value) => String(value || '').trim();

const resolveTagMeta = (item = {}, index) => {
  const label = normalizeSearchKeyword(item[`tag${index}`]);
  const candidates = [
    item[`tag${index}Id`],
    item[`tag${index}_id`],
    item[`tagId${index}`],
  ];
  const matchedId = candidates.find((value) => value !== null && value !== undefined && value !== '');

  return label ? {
    id: matchedId !== undefined ? Number(matchedId) : null,
    label,
  } : null;
};

const buildItemSearchTags = (item = {}) => {
  return [1, 2, 3]
    .map((index) => resolveTagMeta(item, index))
    .filter((tag, index, list) => {
      if (!tag) return false;
      return list.findIndex((current) => current?.label === tag.label) === index;
    });
};

const buildListRequestConfig = () => {
  const title = normalizeSearchKeyword(queryParams.title);
  const shouldUseSearch = isSearchMode.value && !!title;

  if (!shouldUseSearch) {
    return {
      method: 'GET',
      key: `info-gap-list-${queryParams.type}-p${queryParams.pageNum}-all`,
      url: '/info_gap/list',
      payload: {
        ...queryParams,
        title: undefined,
      },
    };
  }

  return {
    method: 'POST',
    key: `info-gap-search-${queryParams.type}-p${queryParams.pageNum}-${encodeURIComponent(title)}`,
    url: '/info_gap/search',
    payload: {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      keyword: title,
      tagId: activeSearchTagId.value,
      category: '',
    },
  };
};

const isTagSelected = (tag) => {
  return selectedTags.value.some((t) => t.id === tag.id);
};

const handleTagClick = (tag) => {
  if (isTagSelected(tag)) return;
  if (selectedTags.value.length >= MAX_TAG_COUNT) {
    const { message } = createDiscreteApi(['message']);
    message.warning(`最多只能选择 ${MAX_TAG_COUNT} 个标签`);
    return;
  }
  selectedTags.value.push(tag);
};

const handleTagClose = (tag, e) => {
  e?.stopPropagation?.(); // 防止 close 触发 click 导致又被加回去
  selectedTags.value = selectedTags.value.filter((t) => t.id !== tag.id);
};

const resetPublishForm = () => {
  isEditMode.value = false;
  editingInfoGapId.value = null;
  Object.assign(form, {
    title: '',
    tag: '技术',
    content: '',
  });

  // 你前面做了标签多选的话，一并清空
  if (typeof selectedTags !== 'undefined' && selectedTags?.value) {
    selectedTags.value = [];
  }
};

// ==================== 3) 列表数据加载 ====================
// 读取列表数据，并把后端字段补齐成前端可直接渲染的结构
const loadData = async () => {
  console.log('--- 正在请求页码 ---', queryParams.pageNum);
  pending.value = true;
  error.value = null;

  try {
    // 使用动态 key，按分类 + 页码区分请求缓存
    const requestConfig = buildListRequestConfig();
    const request = requestConfig.method === 'POST'
      ? useHttpPost(requestConfig.key, requestConfig.url, {
          body: requestConfig.payload,
          watch: false,
          $: true,
        })
      : useHttpGet(requestConfig.key, requestConfig.url, {
          query: requestConfig.payload,
          watch: false,
          $: true,
        });
    const { data, error: fetchError } = await request;

    if (fetchError.value) {
      error.value = fetchError.value;
      return;
    }

    if (data.value) {
      // 统一初始化交互字段，避免模板侧出现 undefined
      rows.value = (data.value.rows || []).map((row) => ({
        ...row,
        // 显式补齐时间字段，兼容后端仅返回 createTime 的场景
        updateTime: row.updateTime || row.createTime || '',
        isVoted: row.isVoted || 0,
        goodCount: row.goodCount || 0,
        middleCount: row.middleCount || 0,
        badCount: row.badCount || 0,
        collectCount: Number(row.collectCount || 0),
        isFollowed: !!row.isFollowed,
        isExpanded: false,
        tag1: row.tag1 || '',
        tag2: row.tag2 || '',
        tag3: row.tag3 || '',
        searchTags: buildItemSearchTags(row),
      }));
      total.value = data.value.total || 0;
    } else {
      rows.value = [];
      total.value = 0;
    }
  } catch (err) {
    error.value = err;
  } finally {
    pending.value = false;
  }
};

// ==================== 4) 顶部筛选与分页事件 ====================
const handlePageChange = (p) => {
  console.log('正在跳转至页码:', p);
  syncToPage(p);
};

// 切换类型后回到第一页
const handleTypeChange = async (value) => {
  queryParams.type = value;
  isSearchMode.value = false;
  queryParams.title = '';
  activeSearchTagId.value = null;
  await syncToPage(1);
};

// 搜索时回到第一页
const handleSearch = async () => {
  queryParams.title = normalizeSearchKeyword(queryParams.title);
  isSearchMode.value = !!queryParams.title;
  activeSearchTagId.value = null;
  await syncToPage(1);
};

const handleTagSearch = async (tag) => {
  queryParams.title = normalizeSearchKeyword(tag?.label);
  isSearchMode.value = !!queryParams.title;
  activeSearchTagId.value = tag?.id ?? null;
  queryParams.type = 'hot';
  await syncToPage(1);
};

// ==================== 5) 路由参数与查询参数同步 ====================
// 从路由读取当前的筛选条件
const getRouteType = () => route.query.type || 'hot';
const getRouteSearchMode = () => route.query.search === '1';
const getRouteTitle = () =>
  typeof route.query.title === 'string' ? normalizeSearchKeyword(route.query.title) : '';
const getRoutePageNum = () => parseInt(route.params.page) || 1;

// 同步到目标页：同页则直接刷新，不同页则更新 URL
const syncToPage = async (page) => {
  queryParams.pageNum = page;
  queryParams.title = normalizeSearchKeyword(queryParams.title);

  const nextType = queryParams.type || 'hot';
  const nextTitle = queryParams.title;
  const nextSearchMode = isSearchMode.value && !!nextTitle;
  const shouldNavigate =
    getRoutePageNum() !== page ||
    getRouteType() !== nextType ||
    getRouteTitle() !== nextTitle ||
    getRouteSearchMode() !== nextSearchMode;

  if (!shouldNavigate) {
    await loadData();
    return;
  }

  const nextQuery = {
    ...route.query,
    type: nextType,
  };

  if (isSearchMode.value && nextTitle) {
    nextQuery.title = nextTitle;
    nextQuery.search = '1';
  } else {
    delete nextQuery.title;
    delete nextQuery.search;
  }

  await navigateTo({
    path: `/info_gap/${page}`,
    query: nextQuery,
  });
};

// 监听 URL 页码变化，并把 URL 上的 type/title 同步回查询参数
watch(
  () => [route.params.page, route.query.type, route.query.title, route.query.search],
  () => {
    queryParams.pageNum = getRoutePageNum();
    queryParams.type = getRouteType();
    queryParams.title = getRouteTitle();
    isSearchMode.value = getRouteSearchMode() && !!queryParams.title;
    if (!isSearchMode.value) {
      activeSearchTagId.value = null;
    }
    loadData();
  },
  { immediate: true }
);

// ==================== 6) 纯工具函数 ====================
// 时间格式化：2026-03-27T07:48:39 -> 03-27 07:48
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

// 点开详情页
const handleDetail = (id) => navigateTo(`/detail/info_gap/${id}`);

// ==================== 7) 发布弹窗与发布流程 ====================
// 打开发布弹窗
const handlePublish = () => {
  resetPublishForm();
  showModal.value = true;
};

const handleEditInfoGap = (item) => {
  isEditMode.value = true;
  editingInfoGapId.value = item.id;
  Object.assign(form, {
    title: item.title || '',
    tag: item.tag || '技术',
    content: item.content || '',
  });
  selectedTags.value = candidateTags.value.filter((tag) =>
    [item.tag1, item.tag2, item.tag3].includes(tag.name)
  );
  showModal.value = true;
};

// 提交发布：校验 -> 请求 -> 提示 -> 关闭并刷新列表
const confirmPublish = async () => {
  if (!form.title || !form.content) {
    const { message } = createDiscreteApi(['message']);
    return message.warning('请填写完整内容');
  }

  console.log("selectedTags =", selectedTags.value);

  btnLoading.value = true;
  const tagIds = selectedTags.value
    .map((tag) => tag.id)
    .filter((id) => id != null);

  console.log("tagIds =", tagIds);

  try {
    const requestKey = isEditMode.value && editingInfoGapId.value
      ? `update-info-gap-${editingInfoGapId.value}`
      : 'add-info-gap';
    const requestUrl = isEditMode.value ? '/info_gap/update' : '/info_gap/save';
    const requestBody = isEditMode.value
      ? {
          id: editingInfoGapId.value,
          title: form.title,
          content: form.content,
          tag: form.tag,
          tagIds,
        }
      : {
          title: form.title,
          tag: form.tag,
          content: form.content,
          tagIds,
        };

    const { data, error: postError } = await useHttpPost(
      requestKey,
      requestUrl,
      {
        body: requestBody,
        $: true,
      }
    );

    if (postError.value) throw new Error(postError.value);

    const { message } = createDiscreteApi(['message']);
    message.success(isEditMode.value ? '修改成功' : '发布成功');

    const wasEditMode = isEditMode.value;
    showModal.value = false;
    resetPublishForm();

    if (wasEditMode) {
      await loadData();
    } else {
      await syncToPage(1);
    }
  } catch (err) {
    console.error('发布失败:', err);
  } finally {
    btnLoading.value = false;
  }
};

// ==================== 8) 列表交互动作 ====================
// 评价动作：乐观更新 + 请求失败回滚
const handleDeleteInfoGap = (item) => {
  const { dialog, message } = createDiscreteApi(['dialog', 'message']);

  dialog.warning({
    title: '确认删除',
    content: `确定删除「${item?.title || '这条信息差'}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const { error: deleteError } = await useHttpGet(
          `delete-info-gap-${item.id}`,
          '/info_gap/delete',
          {
            query: { infoGapId: item.id },
            $: true,
          }
        );

        if (deleteError.value) {
          throw new Error(deleteError.value);
        }

        message.success('删除成功');
        await loadData();
      } catch (err) {
        message.error(err?.message || '删除失败');
      }
    },
  });
};

const handleVote = async (item, type) => {
  const { message } = createDiscreteApi(['message']);

  // 先存快照，用于失败时回滚
  const oldVoted = item.isVoted;
  const oldCounts = {
    1: item.goodCount,
    2: item.middleCount,
    3: item.badCount,
  };

  // 本地先更新 UI
  if (oldVoted === type) {
    updateCount(item, type, -1);
    item.isVoted = 0;
  } else {
    if (oldVoted !== 0) {
      updateCount(item, oldVoted, -1);
    }
    updateCount(item, type, 1);
    item.isVoted = type;
  }

  // 再发请求，失败则回滚
  try {
    const { error } = await useHttpPost('info-vote', '/info_gap/vote', {
      query: { id: item.id, type: type },
      $: true,
    });
    if (error.value) throw new Error(error.value.message || '后端处理失败');
    message.success(item.isVoted === 0 ? '已取消点评' : '点评成功');
  } catch (err) {
    item.isVoted = oldVoted;
    item.goodCount = oldCounts[1];
    item.middleCount = oldCounts[2];
    item.badCount = oldCounts[3];
    message.error('操作失败：' + err.message);
  }
};

// 关注动作：乐观更新 + 请求失败回滚
const handleFollow = async (item) => {
  const { message } = createDiscreteApi(['message']);

  // 本地先更新 UI，失败再回滚
  const originalStatus = item.isFollowed;
  const originalCollectCount = Number(item.collectCount || 0);
  item.isFollowed = !item.isFollowed;
  item.collectCount = Math.max(
    0,
    originalCollectCount + (item.isFollowed ? 1 : -1)
  );

  try {
    const { error } = await useHttpGet(
      `info-follow-${item.id}`,
      `/info_gap/collect`,
        {
          params: { infoGapId: item.id },
          $: true,
        }
    );

    if (error.value) throw error.value;

    message.success(item.isFollowed ? '收藏成功' : '取消收藏成功');
  } catch (err) {
    item.isFollowed = originalStatus;
    item.collectCount = originalCollectCount;
    message.error('收藏失败，请检查网络！！！');
  }
};

// 展开/收起单条内容
const toggleExpand = (item) => {
  item.isExpanded = !item.isExpanded;
};

// 统一更新三种评价计数
const updateCount = (item, type, delta) => {
  if (type === 1) item.goodCount += delta;
  if (type === 2) item.middleCount += delta;
  if (type === 3) item.badCount += delta;
};

// ==================== 9) 页面元信息 ====================
useHead({ title: '信息差 - 开源助手' });
</script>

<style scoped>
.info-gap-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 16px;
}

.notice-bar {
  margin-bottom: 16px;
}

.top-toolbar {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #efeff5;
  margin-bottom: 20px;
}

.tag-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.tag-count {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.list-wrapper {
  background: #fff;
  border: 1px solid #d8e0ea;
  border-radius: 12px;
  overflow: hidden;
}

.info-item-row-card {
  background: #fff;
  border-bottom: 1px solid #dfe5ee;
  position: relative;
}

.info-item-row-card:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  height: 1px;
  background: #e3e8f0;
}

.info-item-row-card:hover {
  background: #fafcff;
}

.feed-card-body {
  padding: 16px 20px 12px;
}

.feed-title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.feed-title-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

.feed-tag {
  color: #0f766e;
  font-size: 18px;
  line-height: 1.6;
  font-weight: 700;
  white-space: nowrap;
}

.feed-title {
  font-size: 18px;
  line-height: 1.6;
  font-weight: 700;
  color: #111827;
  word-break: break-word;
}

.feed-tag-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.feed-search-tag-button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feed-search-tag-button:hover {
  border-color: #0f766e;
  color: #0f766e;
  background: #ecfeff;
}

.detail-content-area {
  padding: 0;
  margin-bottom: 12px;
  background: transparent;
  color: #475467;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.feed-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.feed-more-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.feed-more-button {
  border: 1px solid #d0d5dd;
  background: #fff;
  color: #475467;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feed-more-button:hover {
  border-color: #98a2b3;
  color: #111827;
  background: #f8fafc;
}

.feed-more-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 88px;
}

.feed-more-menu-item {
  border: 1px solid #e4e7ec;
  background: #fff;
  color: #344054;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feed-more-menu-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #111827;
}

.feed-more-menu-item.danger:hover {
  border-color: #fda4af;
  background: #fff1f2;
  color: #be123c;
}

.feed-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #98a2b3;
  line-height: 1;
  flex-shrink: 0;
}

.feed-stat.clickable {
  cursor: pointer;
}

.feed-stat.clickable:hover {
  color: #111827;
}

.feed-publisher {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #98a2b3;
  line-height: 1;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 14px;
  opacity: 0.85;
}

.is-active {
  background: #f8fbff;
  box-shadow: inset 3px 0 0 #0f766e;
}

.info-item-row-card {
  background: #fff;
  border: none;
  border-bottom: 1px solid #eef1f4;
  border-radius: 0;
  margin-bottom: 0;
  padding: 0;
  cursor: default;
  transition: background 0.2s ease;
}

.feed-main-area {
  cursor: pointer;
  padding-bottom: 8px;
}

.feed-main-area:hover .feed-title {
  color: #0f172a;
}

.detail-content-area {
  padding: 0;
  margin-top: 10px;
  margin-bottom: 0;
  background: transparent;
  color: #475467;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.feed-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  border-top: 2px solid #d9e0ea;
  padding-top: 8px;
}

</style>
