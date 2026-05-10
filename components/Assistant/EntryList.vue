<template>
  <div class="entry-list">
    <button class="entry-card" type="button" @click="$emit('open', 'site')">
      <div class="entry-icon site">网</div>
      <div class="entry-text">
        <div class="entry-title">网站问答</div>
        <div class="entry-desc">注册、登录、购买、积分、优惠券等使用问题</div>
      </div>
    </button>

    <NTooltip v-if="courseDisabled" trigger="hover">
      <template #trigger>
        <span class="entry-tooltip-wrap">
          <button class="entry-card disabled" type="button" disabled>
            <div class="entry-icon course disabled">课</div>
            <div class="entry-text">
              <div class="entry-title">课程问答</div>
              <div class="entry-desc">
                {{ courseDescription }}
              </div>
            </div>
          </button>
        </span>
      </template>
      {{ courseDisabledReason }}
    </NTooltip>

    <button v-else class="entry-card" type="button" @click="$emit('open', 'course')">
      <div class="entry-icon course">课</div>
      <div class="entry-text">
        <div class="entry-title">课程问答</div>
        <div class="entry-desc">
          {{ courseDescription }}
        </div>
      </div>
    </button>

    <button class="entry-card" type="button" @click="goToFeedbackPage">
      <div class="entry-icon feedback">反</div>
      <div class="entry-text">
        <div class="entry-title">问题反馈</div>
        <div class="entry-desc">
          {{ feedbackDescription }}
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { NTooltip } from 'naive-ui'
import { createDiscreteApi } from 'naive-ui'

const { message } = createDiscreteApi(['message'])
const route = useRoute()

const props = defineProps({
  initState: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits(['open'])

const courseDisabled = computed(() => !props.initState?.courseQaEnabled)

const courseDisabledReason = computed(() => {
  return props.initState?.courseQaReason || '当前暂不可使用课程问答'
})

const courseDescription = computed(() => {
  if (!props.initState?.courseId) {
    return '进入课程详情页或学习页后，可针对当前课程提问'
  }
  if (props.initState?.courseQaEnabled) {
    return props.initState?.courseName
      ? `当前课程：${props.initState.courseName}`
      : '可针对当前课程内容提问'
  }
  return props.initState?.courseQaReason || '仅已购课用户或 VIP 可用'
})

const feedbackDescription = computed(() => {
  return props.initState?.feedbackEnabled
    ? '提交功能异常、产品建议、内容反馈和账号订单问题，并查看处理状态'
    : (props.initState?.feedbackMessage || '登录后可提交并查看反馈')
})

function goToFeedbackPage() {
  // 检查是否已经在反馈列表页面
  if (route.path === '/feedback/list') {
    message.info('您已经在反馈列表页面了')
    return
  }
  navigateTo('/feedback/list')
}
</script>

<style scoped>
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-tooltip-wrap {
  display: block;
  width: 100%;
}

.entry-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}

.entry-card:hover {
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.entry-card.disabled {
  cursor: not-allowed;
  opacity: .72;
  border-color: #e2e8f0;
  box-shadow: none;
  transform: none;
}

.entry-card.disabled:hover {
  border-color: #e2e8f0;
  box-shadow: none;
  transform: none;
}

.entry-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.entry-icon.site {
  background: #dbeafe;
  color: #1d4ed8;
}

.entry-icon.course {
  background: #dcfce7;
  color: #15803d;
}

.entry-icon.course.disabled {
  background: #e2e8f0;
  color: #64748b;
}

.entry-icon.feedback {
  background: #fef3c7;
  color: #b45309;
}

.entry-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.entry-desc {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}
</style>
