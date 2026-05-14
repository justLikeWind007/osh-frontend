<template>
  <div class="session-tabs">
    <div
      v-for="session in sessions"
      :key="session.id"
      class="session-tab"
      :class="[
        `status-${session.status}`,
        { active: modelValue === session.id }
      ]"
      @click="$emit('update:modelValue', session.id)"
    >
      <span class="session-name">{{ session.name }}</span>
      <span class="session-badge">
        <template v-if="session.status === 'active'">进行中</template>
        <template v-else-if="session.status === 'pending'">即将开始</template>
        <template v-else-if="session.status === 'draft'">未发布</template>
        <template v-else>已结束</template>
      </span>
      <!-- 下架标记 -->
      <span v-if="session.rawStatus === 4" class="draft-tag">已下架</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sessions: { type: Array, default: () => [] },
  // modelValue 为活动 id（Number）
  modelValue: { type: [Number, String], default: null },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.session-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 0;
}
.session-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  background: #f5f5f5;
  transition: all 0.2s;
  min-width: 90px;
}
.session-tab:hover {
  border-color: #f43f5e;
}
.session-tab.active {
  background: #fff1f2;
  border-color: #f43f5e;
}
.session-name {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}
.session-badge {
  font-size: 11px;
  margin-top: 3px;
  padding: 1px 6px;
  border-radius: 10px;
}
/* 进行中 — 红色 */
.status-active .session-badge {
  background: #f43f5e;
  color: #fff;
}
/* 即将开始 — 橙色 */
.status-pending .session-badge {
  background: #f59e0b;
  color: #fff;
}
/* 已结束 — 灰色 */
.status-ended .session-badge {
  background: #d1d5db;
  color: #6b7280;
}
.status-ended .session-name {
  color: #9ca3af;
}
/* 草稿 — 灰蓝色 */
.status-draft .session-badge {
  background: #6366f1;
  color: #fff;
}
.status-draft .session-name {
  color: #6366f1;
}
/* 草稿标记 */
.draft-tag {
  font-size: 10px;
  margin-top: 2px;
  padding: 1px 5px;
  border-radius: 8px;
  background: #e5e7eb;
  color: #6b7280;
}
</style>
