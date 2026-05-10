<template>
  <div class="assistant-shell" :class="shellClass" :style="shellStyle">
    <button
      v-if="!isOpen"
      class="assistant-trigger"
      type="button"
      @click="openPanel"
    >
      <span class="trigger-icon-wrap" aria-hidden="true">
        <svg class="trigger-icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 10.5a7 7 0 1 1 14 0v4.2a1.8 1.8 0 0 1-1.8 1.8H16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <rect x="3.5" y="11" width="3" height="5.5" rx="1.5" fill="currentColor"/>
          <rect x="17.5" y="11" width="3" height="5.5" rx="1.5" fill="currentColor"/>
          <path d="M9 19.5h4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="trigger-text">
        <template v-if="triggerLabelLines.length === 2">
          <span>{{ triggerLabelLines[0] }}</span>
          <span>{{ triggerLabelLines[1] }}</span>
        </template>
        <template v-else>
          {{ triggerLabel }}
        </template>
      </span>
    </button>

    <div v-else :class="['assistant-panel', { detail: isDetailView }]">
      <div class="panel-head">
        <button v-if="activeView !== 'home'" class="icon-btn" type="button" @click="activeView = 'home'">←</button>
        <div class="head-title">
          <div class="title-main">{{ panelTitle }}</div>
          <div class="title-sub">{{ panelSubtitle }}</div>
        </div>
        <button class="icon-btn" type="button" @click="closePanel">×</button>
      </div>

      <div class="panel-body">
        <AssistantEntryList
          v-if="activeView === 'home'"
          :init-state="initState"
          @open="openView"
        />

        <AssistantQaPanel
          v-else-if="activeView === 'site'"
          :description="'优先回答网站的使用方式、购买流程、积分和优惠券等问题。'"
          :suggestions="siteSuggestions"
          :messages="siteMessages"
          :sending="siteSending"
          :on-send="sendSiteQuestion"
          :placeholder="'问我一个网站使用问题'"
        />

        <AssistantQaPanel
          v-else-if="activeView === 'course'"
          :description="courseDescription"
          :suggestions="courseSuggestions"
          :messages="courseMessages"
          :sending="courseSending"
          :disabled="!initState.courseQaEnabled"
          :disabled-reason="courseDisabledReason"
          :show-login-action="courseShowLoginAction"
          :on-send="sendCourseQuestion"
          :on-login="goLogin"
          :placeholder="'问我一个课程学习问题'"
        />

        <AssistantFeedbackPanel
          v-else-if="activeView === 'feedback'"
          :items="feedbackItems"
          :can-submit="!!initState.feedbackEnabled"
          :hint="feedbackHint"
          :show-login-action="!initState.feedbackEnabled"
          :loading="feedbackLoading"
          :submitting="feedbackSubmitting"
          :page-path="route.fullPath"
          :on-submit="submitFeedback"
          :on-refresh="loadFeedback"
          :on-login="goLogin"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { createDiscreteApi } from 'naive-ui'
import {
  apiAskCourseQuestion,
  apiAskSiteQuestion,
  apiCreateAssistantFeedback,
  apiGetAssistantInit,
  apiGetMyAssistantFeedback,
} from '~/composables/assistant'

const { message } = createDiscreteApi(['message'])
const route = useRoute()

const isOpen = ref(false)
const lastDetailView = ref('')
const dragState = reactive({
  width: 60,
  height: 60,
})
const activeView = ref('home')
const initLoading = ref(false)
const feedbackLoading = ref(false)
const feedbackSubmitting = ref(false)
const siteSending = ref(false)
const courseSending = ref(false)

const initState = ref({
  loggedIn: false,
  feedbackEnabled: false,
  feedbackMessage: '请先登录后提交反馈',
  courseId: null,
  courseName: '',
  courseQaEnabled: false,
  courseQaReason: '进入课程页后可提问',
})

const feedbackItems = ref([])
const siteMessages = ref([])
const courseMessages = ref([])

const siteSuggestions = [
  '怎么购买课程？',
  '优惠券怎么使用？',
  '积分什么时候会扣减？',
]

const courseSuggestions = computed(() => {
  if (!currentCourseId.value) {
    return ['进入课程详情页后再提问', '课程资料在哪里看？']
  }
  return ['这个课程适合什么人？', '课程资料在哪里？', '课程大纲怎么看？']
})

const panelTitle = computed(() => {
  if (activeView.value === 'site') return '网站问答'
  if (activeView.value === 'course') return '课程问答'
  if (activeView.value === 'feedback') return '问题反馈'
  return '智能助手'
})

const panelSubtitle = computed(() => {
  if (activeView.value === 'site') return '全站使用问题'
  if (activeView.value === 'course') return '课程学习问题'
  if (activeView.value === 'feedback') return '提交问题并跟踪状态'
  return ''
})

const feedbackHint = computed(() => {
  return initState.value.feedbackEnabled
    ? ''
    : (initState.value.feedbackMessage || '请先登录后提交反馈')
})

const courseDescription = computed(() => {
  if (initState.value.courseName) {
    return `当前课程：${initState.value.courseName}`
  }
  return '仅针对当前课程内容和学习路径提问。'
})

const courseDisabledReason = computed(() => {
  return initState.value.courseQaEnabled ? '' : (initState.value.courseQaReason || '当前不可使用课程问答')
})

const courseShowLoginAction = computed(() => {
  if (initState.value.courseQaEnabled) return false
  return !initState.value.loggedIn && currentCourseId.value && courseDisabledReason.value.includes('登录')
})

const currentCourseId = computed(() => {
  const path = route.path || ''
  const queryCourseId = toPositiveNumber(route.query.courseId)
  const paramId = toPositiveNumber(route.params.id)

  // 1. 只要页面已经显式带了 courseId query，优先采用它
  if (queryCourseId) {
    return queryCourseId
  }

  // 2. 课程营销页 / 学习中心页：/course_detail/:id
  if (/^\/course_detail\/\d+$/.test(path) && paramId) {
    return paramId
  }

  // 3. 某些课程编辑/管理明细页也可能直接以 /course/:id 打开
  // 避免误识别列表页，只接受纯数字 id 且不带 page 参数的场景
  if (/^\/course\/\d+$/.test(path) && paramId && !route.params.page) {
    return paramId
  }

  return null
})

function toPositiveNumber(value) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const isDetailView = computed(() => isOpen.value && activeView.value !== 'home')

const shellClass = computed(() => ({
  open: isOpen.value,
  closed: !isOpen.value,
  detail: isDetailView.value,
}))

const shellStyle = computed(() => {
  if (!process.client) return {}
  if (!isOpen.value) {
    return {
      right: '16px',
      bottom: '80px',
      width: `${dragState.width}px`,
      height: `${dragState.height}px`,
    }
  }

  const panelWidth = resolvePanelWidth(isDetailView.value)
  const panelHeight = resolvePanelHeight(isDetailView.value)

  const defaultLeft = isDetailView.value
    ? (window.innerWidth - panelWidth) / 2
    : window.innerWidth - panelWidth - 16
  const defaultTop = isDetailView.value
    ? Math.max(28, (window.innerHeight - panelHeight) / 2)
    : Math.max(24, window.innerHeight - panelHeight - 80)

  return {
    left: `${Math.max(12, Math.min(defaultLeft, window.innerWidth - panelWidth - 12))}px`,
    top: `${Math.max(12, Math.min(defaultTop, window.innerHeight - panelHeight - 12))}px`,
    width: `${panelWidth}px`,
    height: `${panelHeight}px`,
  }
})

const triggerLabel = computed(() => {
  if (lastDetailView.value === 'site') return '网站问答'
  if (lastDetailView.value === 'course') return '课程问答'
  if (lastDetailView.value === 'feedback') return '问题反馈'
  return '咨询帮助'
})

const triggerLabelLines = computed(() => {
  if (triggerLabel.value === '网站问答') return ['网站', '问答']
  if (triggerLabel.value === '课程问答') return ['课程', '问答']
  if (triggerLabel.value === '问题反馈') return ['问题', '反馈']
  if (triggerLabel.value === '咨询帮助') return ['咨询', '帮助']
  return [triggerLabel.value]
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

watch(
  () => route.fullPath,
  () => {
    if (!isOpen.value) return
    loadInit()
  }
)

watch(currentCourseId, () => {
  courseMessages.value = []
  if (!isOpen.value) return
  loadInit()
  if (activeView.value === 'course') {
    ensureIntro('course')
  }
})

function openPanel() {
  isOpen.value = true
  activeView.value = lastDetailView.value || 'home'
  loadInit()
  if (activeView.value !== 'home') {
    ensureIntro(activeView.value)
    if (activeView.value === 'feedback' && initState.value.feedbackEnabled) {
      loadFeedback()
    }
  }
}

function closePanel() {
  if (activeView.value === 'home') {
    lastDetailView.value = ''
  }
  isOpen.value = false
}

function openView(view) {
  activeView.value = view
  if (view !== 'home') {
    lastDetailView.value = view
  }
  ensureIntro(view)
  if (view === 'feedback' && initState.value.feedbackEnabled) {
    loadFeedback()
  }
}

function ensureIntro(view) {
  if (view === 'site' && !siteMessages.value.length) {
    siteMessages.value.push({
      role: 'assistant',
      content: '你好，我现在可以先回答网站使用相关的固定演示问题，比如登录、购买、优惠券和积分。',
    })
  }
  if (view === 'course' && !courseMessages.value.length) {
    const intro = initState.value.courseQaEnabled
      ? `你好，我现在会用固定演示回答来处理课程问题${initState.value.courseName ? `，当前课程是《${initState.value.courseName}》` : ''}。`
      : (initState.value.courseQaReason || '当前课程问答暂不可用。')
    courseMessages.value.push({
      role: 'assistant',
      content: intro,
    })
  }
}

async function loadInit() {
  initLoading.value = true
  try {
    const res = await apiGetAssistantInit(currentCourseId.value)
    if (res?.code === 200 && res.data) {
      initState.value = {
        ...initState.value,
        ...res.data,
      }
    }
  } catch (error) {
    console.error('[assistant] init error', error)
  } finally {
    initLoading.value = false
  }
}

async function sendSiteQuestion(question) {
  siteMessages.value.push({ role: 'user', content: question })
  siteSending.value = true
  try {
    const res = await apiAskSiteQuestion(question)
    if (res?.code === 200 && res.data?.answer) {
      siteMessages.value.push({ role: 'assistant', content: res.data.answer })
      return
    }
    throw new Error(res?.msg || '发送失败')
  } catch (error) {
    const text = error?.data?.msg || error?.message || '发送失败'
    message.error(text)
    siteMessages.value.push({ role: 'assistant', content: `暂时没有成功返回答案：${text}` })
  } finally {
    siteSending.value = false
  }
}

async function sendCourseQuestion(question) {
  if (!currentCourseId.value) {
    message.warning('当前页面没有课程上下文，请进入课程详情页或学习页后再试')
    return
  }
  courseMessages.value.push({ role: 'user', content: question })
  courseSending.value = true
  try {
    const res = await apiAskCourseQuestion(currentCourseId.value, question)
    if (res?.code === 200 && res.data?.answer) {
      courseMessages.value.push({ role: 'assistant', content: res.data.answer })
      return
    }
    throw new Error(res?.msg || '发送失败')
  } catch (error) {
    const text = error?.data?.msg || error?.message || '发送失败'
    message.error(text)
    courseMessages.value.push({ role: 'assistant', content: text })
    if (error?.data?.code === 401 || error?.data?.code === 403) {
      await loadInit()
    }
  } finally {
    courseSending.value = false
  }
}

async function loadFeedback() {
  if (!initState.value.feedbackEnabled) return
  feedbackLoading.value = true
  try {
    const res = await apiGetMyAssistantFeedback()
    if (res?.code === 200) {
      feedbackItems.value = res.data || []
      return
    }
    throw new Error(res?.msg || '加载失败')
  } catch (error) {
    const text = error?.data?.msg || error?.message || '加载失败'
    message.error(text)
  } finally {
    feedbackLoading.value = false
  }
}

async function submitFeedback(payload) {
  if (!initState.value.feedbackEnabled) {
    goLogin()
    return false
  }

  feedbackSubmitting.value = true
  try {
    const res = await apiCreateAssistantFeedback(payload)
    if (res?.code === 200 && res.data) {
      message.success('工单已提交')
      feedbackItems.value = [res.data, ...feedbackItems.value]
      return true
    }
    throw new Error(res?.msg || '提交失败')
  } catch (error) {
    const text = error?.data?.msg || error?.message || '提交失败'
    message.error(text)
    return false
  } finally {
    feedbackSubmitting.value = false
  }
}

function goLogin() {
  navigateTo(`/login?from=${encodeURIComponent(route.fullPath)}`)
}

function handleResize() {
  if (!process.client || !isOpen.value) return
}

function resolvePanelWidth(detail = false) {
  if (!process.client) return detail ? 900 : 400
  if (window.innerWidth <= 768) {
    return detail ? Math.min(window.innerWidth - 20, 680) : Math.min(380, window.innerWidth - 24)
  }
  if (detail) {
    return Math.min(980, Math.max(760, Math.round(window.innerWidth * 0.72)))
  }
  return Math.min(420, Math.max(380, Math.round(window.innerWidth * 0.26)))
}

function resolvePanelHeight(detail = false) {
  if (!process.client) return detail ? 760 : 620
  if (window.innerWidth <= 768) {
    return detail
      ? Math.min(window.innerHeight - 48, Math.round(window.innerHeight * 0.84))
      : Math.min(window.innerHeight - 88, Math.round(window.innerHeight * 0.74))
  }
  return detail
    ? Math.min(window.innerHeight - 64, Math.round(window.innerHeight * 0.82))
    : Math.min(window.innerHeight - 120, Math.round(window.innerHeight * 0.72))
}
</script>

<style scoped>
.assistant-shell {
  position: fixed;
  right: auto;
  bottom: auto;
  z-index: 180;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  pointer-events: none;
}

.assistant-trigger {
  width: 60px;
  height: 60px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.98);
  color: #1e293b;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  pointer-events: auto;
  overflow: hidden;
  transition: box-shadow .2s ease, transform .2s ease, background .2s ease, border-color .2s ease;
}

.assistant-trigger:hover {
  border-color: rgba(37, 99, 235, 0.22);
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.16);
}

.trigger-icon-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  transition: opacity .18s ease, transform .18s ease;
}

.trigger-icon {
  width: 30px;
  height: 30px;
}

.trigger-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0;
  transition: opacity .18s ease;
  padding: 4px;
}

.assistant-trigger:hover .trigger-icon-wrap {
  opacity: 0;
  transform: scale(.82);
}

.assistant-trigger:hover .trigger-text {
  opacity: 1;
}

.assistant-panel {
  width: 100%;
  height: 100%;
  max-height: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(12px);
  pointer-events: auto;
  animation: panel-enter .22s ease;
}

.assistant-panel.detail {
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22);
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 10px;
  background: #e2e8f0;
  color: #0f172a;
  cursor: pointer;
  flex-shrink: 0;
}

.head-title {
  flex: 1;
  min-width: 0;
}

.title-main {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.title-sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
  line-height: 1;
}

.panel-body {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .assistant-panel {
    width: 100%;
    height: 100%;
  }
}

@keyframes panel-enter {
  from {
    opacity: 0;
    transform: translateX(10px) translateY(8px) scale(.98);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
  }
}
</style>
