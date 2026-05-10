<template>
  <div class="feedback-panel">
    <div v-if="hint" class="panel-hint">
      <span>{{ hint }}</span>
      <button v-if="showLoginAction" class="hint-btn" type="button" @click="onLogin?.()">去登录</button>
    </div>

    <div class="ticket-tabs">
      <button
        type="button"
        class="ticket-tab"
        :class="{ active: activeTab === 'submit' }"
        @click="activeTab = 'submit'"
      >
        提交工单
      </button>
      <button
        type="button"
        class="ticket-tab"
        :class="{ active: activeTab === 'list' }"
        @click="switchToList"
      >
        我的工单
        <span v-if="items?.length" class="ticket-count">{{ items.length }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'submit'" class="form-card">
      <div class="field-row">
        <div class="field-col">
          <div class="field-label">反馈类型</div>
          <n-select
            v-model:value="form.type"
            class="feedback-select"
            :options="typeSelectOptions"
            :disabled="submitting || !canSubmit"
            placeholder="请选择反馈类型"
          />
        </div>

        <div class="field-col priority-col">
          <div class="field-label">优先级</div>
          <n-select
            v-model:value="form.priority"
            class="feedback-select"
            :options="prioritySelectOptions"
            :disabled="submitting || !canSubmit"
            placeholder="请选择优先级"
          />
        </div>
      </div>

      <div class="type-helper">
        <div class="type-helper-desc">{{ currentTypeMeta.desc }}</div>
      </div>

      <div class="field-label">标题</div>
      <input
        v-model="form.title"
        class="field-input"
        :disabled="submitting || !canSubmit"
        placeholder="一句话描述问题"
        maxlength="128"
      />
      <div class="field-counter">{{ form.title.length }}/128</div>

      <div class="field-label">内容</div>
      <textarea
        v-model="form.content"
        class="field-input field-textarea"
        :disabled="submitting || !canSubmit"
        placeholder="请尽量描述你的场景、现象和期待结果"
        maxlength="1000"
      />
      <div class="field-counter">{{ form.content.length }}/1000</div>

      <button class="submit-btn" type="button" :disabled="!canSubmit || submitting || !canSubmitForm" @click="submit">
        {{ submitting ? '提交中...' : '提交工单' }}
      </button>
    </div>

    <template v-else>
      <template v-if="ticketView === 'list'">
        <div class="list-head">
          <span>我的工单</span>
          <button class="refresh-btn" type="button" :disabled="loading" @click="onRefresh?.()">
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div class="feedback-list">
          <div v-if="!items?.length" class="empty-state">暂无反馈记录</div>
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="feedback-item clickable"
            @click="openTicketDetail(item)"
          >
            <div class="item-head">
              <div class="item-head-main">
                <div class="item-ticket">{{ typeLabel(item.type) }} · {{ priorityLabel(item.priority) }} · {{ formatTime(item.createTime) }}</div>
                <span class="item-title" :title="item.title">{{ item.title }}</span>
              </div>
              <span class="item-status" :class="item.status">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="item-content" :title="item.content">{{ item.content }}</div>
            <div v-if="item.result" class="item-result">处理结果：{{ item.result }}</div>
          </button>
        </div>
      </template>

      <template v-else-if="selectedTicket">
        <div class="list-head">
          <button class="back-btn" type="button" @click="ticketView = 'list'">← 返回工单列表</button>
          <button class="refresh-btn" type="button" :disabled="loading" @click="onRefresh?.()">
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div class="ticket-detail">
          <div class="detail-card">
            <div class="detail-top">
              <div class="detail-meta">{{ typeLabel(selectedTicket.type) }} · {{ priorityLabel(selectedTicket.priority) }} · {{ formatTime(selectedTicket.createTime) }}</div>
              <span class="item-status" :class="selectedTicket.status">{{ statusLabel(selectedTicket.status) }}</span>
            </div>
            <div class="detail-title">{{ selectedTicket.title }}</div>
            <div class="detail-content">{{ selectedTicket.content }}</div>
          </div>

          <div class="detail-card">
            <div class="detail-section-title">当前处理流程</div>
            <div class="status-flow">
              <div
                v-for="(step, index) in ticketFlowSteps"
                :key="step.key"
                class="flow-step"
                :class="flowStepState(step.key)"
              >
                <div class="flow-dot">{{ index + 1 }}</div>
                <div class="flow-text">
                  <div class="flow-title">{{ step.title }}</div>
                  <div class="flow-desc">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-section-title">工单详情</div>
            <div class="detail-line"><span>当前状态</span><strong>{{ statusLabel(selectedTicket.status) }}</strong></div>
            <div class="detail-line"><span>反馈时间</span><strong>{{ formatTime(selectedTicket.createTime) }}</strong></div>
            <div class="detail-line"><span>反馈类型</span><strong>{{ typeLabel(selectedTicket.type) }}</strong></div>
            <div class="detail-line"><span>优先级</span><strong>{{ priorityLabel(selectedTicket.priority) }}</strong></div>
            <div v-if="selectedTicket.result" class="detail-result">
              <div class="detail-section-title small">处理结果</div>
              <div>{{ selectedTicket.result }}</div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { NSelect } from 'naive-ui'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  canSubmit: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  showLoginAction: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  onSubmit: {
    type: Function,
    default: null,
  },
  onRefresh: {
    type: Function,
    default: null,
  },
  onLogin: {
    type: Function,
    default: null,
  },
  pagePath: {
    type: String,
    default: '',
  },
})

const form = reactive({
  type: 'bug',
  priority: 'medium',
  title: '',
  content: '',
})
const activeTab = ref('submit')
const ticketView = ref('list')
const selectedTicket = ref(null)

const typeMetaMap = {
  bug: {
    label: '功能异常',
    desc: '适合页面报错、按钮没反应、上传失败、支付异常等功能类问题。',
  },
  suggestion: {
    label: '产品建议',
    desc: '适合提交新想法、交互建议、需求建议或体验改进建议。',
  },
  content: {
    label: '内容反馈',
    desc: '适合课程内容、资料错误、章节问题、答疑体验等内容相关反馈。',
  },
  account_order: {
    label: '账号/订单问题',
    desc: '适合登录、购买、优惠券、积分、权限、VIP、已购未解锁等账号订单问题。',
  },
  other: {
    label: '其他',
    desc: '如果不确定应该归类到哪里，可以先选择其他，我们会再人工判断。',
  },
}

const typeSelectOptions = [
  { label: '功能异常', value: 'bug' },
  { label: '产品建议', value: 'suggestion' },
  { label: '内容反馈', value: 'content' },
  { label: '账号/订单问题', value: 'account_order' },
  { label: '其他', value: 'other' },
]

const prioritySelectOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
]

const currentTypeMeta = computed(() => typeMetaMap[form.type] || typeMetaMap.other)

const canSubmitForm = computed(() => {
  const title = form.title.trim()
  const content = form.content.trim()
  return !!title && !!content && title.length <= 128 && content.length <= 1000
})

async function submit() {
  if (!props.canSubmit || props.submitting || !canSubmitForm.value) return
  if (form.title.trim().length > 128) return
  if (form.content.trim().length > 1000) return
  const payload = {
    type: form.type,
    priority: form.priority,
    title: form.title.trim(),
    content: form.content.trim(),
    pagePath: props.pagePath,
  }
  const success = await props.onSubmit?.(payload)
  if (success) {
    form.type = 'bug'
    form.priority = 'medium'
    form.title = ''
    form.content = ''
    activeTab.value = 'list'
    ticketView.value = 'list'
    props.onRefresh?.()
  }
}

function switchToList() {
  activeTab.value = 'list'
  ticketView.value = 'list'
  props.onRefresh?.()
}

function openTicketDetail(item) {
  selectedTicket.value = item
  ticketView.value = 'detail'
}

function statusLabel(status) {
  if (status === 'triaged') return '已确认'
  if (status === 'in_progress') return '修复中'
  if (status === 'resolved') return '已修复'
  if (status === 'closed') return '已关闭'
  if (status === 'rejected') return '已驳回'
  return '已提交'
}

function typeLabel(type) {
  if (type === 'suggestion') return '产品建议'
  if (type === 'content') return '内容反馈'
  if (type === 'account_order') return '账号/订单问题'
  if (type === 'other') return '其他'
  return '功能异常'
}

function priorityLabel(priority) {
  if (priority === 'high') return '高优'
  if (priority === 'low') return '低优'
  return '中优'
}

function formatTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

const ticketFlowSteps = [
  {
    key: 'submitted',
    title: '工单已提交',
    desc: '你的反馈已经成功提交，等待系统或人工接收。',
  },
  {
    key: 'triaged',
    title: '已确认',
    desc: '工单已被接收并完成初步确认，准备进入处理阶段。',
  },
  {
    key: 'processing',
    title: '处理中',
    desc: '我们正在排查、修复或跟进这个问题。',
  },
  {
    key: 'closed',
    title: '已结单',
    desc: '问题已处理完成，工单进入结束状态。',
  },
]

function flowStepState(key) {
  const status = selectedTicket.value?.status
  if (!status) return ''
  if (status === 'submitted') {
    return key === 'submitted' ? 'current' : ''
  }
  if (status === 'triaged') {
    if (key === 'submitted') return 'done'
    if (key === 'triaged') return 'current'
    return ''
  }
  if (status === 'in_progress') {
    if (key === 'submitted' || key === 'triaged') return 'done'
    if (key === 'processing') return 'current'
    return ''
  }
  if (status === 'resolved' || status === 'closed' || status === 'rejected') {
    return 'done'
  }
  return ''
}
</script>

<style scoped>
.feedback-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ticket-tabs {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ticket-tab {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: border-color .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease;
}

.ticket-tab.active {
  border-color: #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  color: #1d4ed8;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.10);
}

.ticket-count {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  padding: 0 5px;
}

.panel-hint {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.hint-btn {
  border: none;
  border-radius: 10px;
  background: #0f172a;
  color: #fff;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.form-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.field-label {
  margin-top: 10px;
  margin-bottom: 6px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.field-label:first-child {
  margin-top: 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(104px, 0.9fr);
  gap: 10px;
  align-items: end;
}

.field-col {
  min-width: 0;
}

.priority-col .field-input {
  min-width: 0;
}

.field-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  background: #fff;
}

.type-helper {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.type-helper-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.field-textarea {
  resize: vertical;
  min-height: 92px;
}

.field-counter {
  margin-top: 6px;
  text-align: right;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1;
}

:deep(.feedback-select .n-base-selection) {
  border-radius: 12px;
  min-height: 38px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: none;
}

:deep(.feedback-select .n-base-selection-label) {
  min-height: 38px;
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;
}

:deep(.feedback-select .n-base-selection-input) {
  min-height: 38px;
  display: flex;
  align-items: center;
}

:deep(.feedback-select .n-base-selection:hover) {
  border-color: #94a3b8;
}

:deep(.feedback-select.n-base-select--focus .n-base-selection),
:deep(.feedback-select .n-base-selection.n-base-selection--active) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

@media (max-width: 520px) {
  .field-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

.submit-btn {
  margin-top: 12px;
  width: 100%;
  border: none;
  border-radius: 12px;
  background: #b45309;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.list-head {
  margin-top: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.refresh-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
}

.back-btn {
  border: none;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.feedback-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.ticket-detail {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  color: #94a3b8;
  text-align: center;
  padding: 18px 12px;
  font-size: 12px;
}

.feedback-item {
  padding: 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  margin-bottom: 10px;
}

.feedback-item.clickable {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.feedback-item.clickable:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.item-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.item-head-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.item-title {
  display: -webkit-box;
  max-width: 100%;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  overflow: hidden;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-ticket {
  display: block;
  color: #64748b;
  font-size: 11px;
  line-height: 1.2;
  margin-bottom: 4px;
}

.item-status {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1;
}

.item-status.pending,
.item-status.submitted {
  background: #fef3c7;
  color: #92400e;
}

.item-status.triaged,
.item-status.in_progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.item-status.resolved,
.item-status.closed {
  background: #dcfce7;
  color: #15803d;
}

.item-status.rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.item-content,
.item-result {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.item-content {
  color: #334155;
  display: -webkit-box;
  overflow: hidden;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.item-result {
  color: #0f766e;
}

.detail-card {
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.detail-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-meta {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.detail-title {
  margin-top: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.detail-content {
  margin-top: 10px;
  color: #334155;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-section-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.detail-section-title.small {
  margin-bottom: 6px;
}

.status-flow {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  opacity: .55;
}

.flow-step.done,
.flow-step.current {
  opacity: 1;
}

.flow-dot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: #fff;
}

.flow-step.current .flow-dot {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1d4ed8;
}

.flow-step.done .flow-dot {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.flow-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.flow-desc {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.detail-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
}

.detail-line:last-of-type {
  border-bottom: none;
}

.detail-line strong {
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.detail-result {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f0fdfa;
  color: #0f766e;
  font-size: 12px;
  line-height: 1.7;
}
</style>
