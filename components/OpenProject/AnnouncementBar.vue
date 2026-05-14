<template>
  <Transition name="bar-fade">
    <div v-if="announcements.length > 0" class="announcement-bar">
      <!-- 左侧标签 -->
      <span class="bar-label">🆕 新项目</span>

      <!-- 滚动文字区域 -->
      <div class="bar-scroll-wrap">
        <div class="bar-scroll" :style="{ animationDuration: scrollDuration }">
          <span
            v-for="(item, idx) in announcements"
            :key="item.id"
            class="bar-item"
            @click="handleClick(item)"
          >
            {{ item.content }}
            <span v-if="idx < announcements.length - 1" class="bar-sep">·</span>
          </span>
          <!-- 复制一份实现无缝滚动 -->
          <span
            v-for="(item, idx) in announcements"
            :key="`dup-${item.id}`"
            class="bar-item"
            @click="handleClick(item)"
          >
            {{ item.content }}
            <span v-if="idx < announcements.length - 1" class="bar-sep">·</span>
          </span>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button class="bar-close" @click="dismiss" title="关闭">✕</button>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'

const { projectAnnouncements } = useWebSocket()

// 是否被用户手动关闭
const dismissed = ref(false)

const announcements = computed(() =>
  dismissed.value ? [] : projectAnnouncements.value
)

// 根据条数动态调整滚动速度
const scrollDuration = computed(() => {
  const count = announcements.value.length
  return `${Math.max(10, count * 6)}s`
})

function handleClick(item) {
  if (item.jumpUrl) navigateTo(item.jumpUrl)
}

function dismiss() {
  dismissed.value = true
}
</script>

<style scoped>
.announcement-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #eff6ff, #f0fdf4);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 16px;
  overflow: hidden;
}

/* 进出动画 */
.bar-fade-enter-active, .bar-fade-leave-active {
  transition: opacity 0.3s ease, max-height 0.3s ease;
  max-height: 60px;
}
.bar-fade-enter-from, .bar-fade-leave-to {
  opacity: 0;
  max-height: 0;
}

.bar-label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 滚动容器 */
.bar-scroll-wrap {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.bar-scroll {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  animation: scroll-left linear infinite;
}

@keyframes scroll-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.bar-item {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  padding: 0 8px;
  transition: color 0.15s;
}
.bar-item:hover { color: #1d4ed8; text-decoration: underline; }

.bar-sep {
  color: #9ca3af;
  margin-left: 8px;
}

.bar-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
}
.bar-close:hover { color: #374151; }
</style>
