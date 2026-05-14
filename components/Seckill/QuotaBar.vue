<template>
  <!-- quota=0 表示不限量 -->
  <div class="quota-bar-wrap" v-if="quota === 0">
    <span class="quota-unlimited">🔓 不限量</span>
  </div>
  <div class="quota-bar-wrap" v-else>
    <div class="quota-track">
      <div
        class="quota-fill"
        :class="progress >= 80 ? 'fill-hot' : ''"
        :style="{ width: progress + '%' }"
      />
    </div>
    <span class="quota-text" :class="progress >= 80 ? 'text-hot' : ''">
      已抢 {{ progress }}%
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  quota:     { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
})

const progress = computed(() =>
  props.quota > 0
    ? Math.min(Math.round((props.soldCount / props.quota) * 100), 100)
    : 0
)
</script>

<style scoped>
.quota-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
}
.quota-track {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.quota-fill {
  height: 100%;
  background: #e1251b;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.quota-fill.fill-hot {
  background: linear-gradient(90deg, #e1251b, #ff4747);
  animation: pulse-bar 1.5s ease-in-out infinite;
}
@keyframes pulse-bar {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}
.quota-text {
  font-size: 11px;
  color: #e1251b;
  white-space: nowrap;
  flex-shrink: 0;
}
.quota-text.text-hot {
  font-weight: 700;
  color: #e1251b;
}
.quota-unlimited {
  font-size: 11px;
  color: #22c55e;
  font-weight: 500;
}
</style>
