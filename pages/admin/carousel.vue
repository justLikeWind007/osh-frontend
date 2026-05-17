<template>
  <div class="carousel-admin-page">
    <div class="carousel-admin-header">
      <div class="carousel-admin-header-left">
        <button class="carousel-admin-back" @click="navigateTo('/')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回首页
        </button>
        <h1 class="carousel-admin-title">轮播图管理</h1>
        <span class="carousel-admin-count">共 {{ carouselList.length }} 项</span>
      </div>
      <div class="carousel-admin-header-right">
        <button class="carousel-admin-add-btn" @click="addNewCard">
          + 新增卡片
        </button>
        <button class="carousel-admin-save-btn" @click="saveAll" :disabled="saving">
          {{ saving ? '保存中...' : '保存全部' }}
        </button>
      </div>
    </div>

    <div class="carousel-admin-list">
      <div
        v-for="(item, idx) in carouselList"
        :key="item.id || idx"
        class="carousel-admin-card"
      >
        <!-- 左侧：序号 + 图标预览 -->
        <div class="carousel-admin-card-left">
          <div class="carousel-admin-card-num">{{ idx + 1 }}</div>
          <div class="carousel-admin-card-preview" :style="{ background: item.cardBg }">
            <span class="carousel-admin-card-emoji">{{ item.emoji }}</span>
          </div>
        </div>

        <!-- 中间：编辑表单 -->
        <div class="carousel-admin-card-form">
          <div class="carousel-admin-form-row">
            <input
              v-model="item.title"
              class="carousel-admin-input carousel-admin-input-title"
              placeholder="卡片标题"
            />
            <input
              v-model="item.emoji"
              class="carousel-admin-input carousel-admin-input-emoji"
              placeholder="😀"
              maxlength="2"
            />
          </div>
          <input
            v-model="item.subtitle"
            class="carousel-admin-input"
            placeholder="副标题描述"
          />
          <div class="carousel-admin-form-row">
            <input
              v-model="item.btnText"
              class="carousel-admin-input"
              placeholder="按钮文字"
            />
            <input
              v-model="item.path"
              class="carousel-admin-input"
              placeholder="跳转路径 如 /list/flashsale/1"
            />
          </div>
          <!-- 右侧功能描述（feature1/2/3） -->
          <div class="carousel-admin-features">
            <span class="carousel-admin-features-label">标签：</span>
            <div class="carousel-admin-feature-tag">
              <input v-model="item.feature1" class="carousel-admin-feature-input" placeholder="功能描述1" />
              <button v-if="item.feature1" class="carousel-admin-feature-del" @click="item.feature1 = ''">×</button>
            </div>
            <div class="carousel-admin-feature-tag">
              <input v-model="item.feature2" class="carousel-admin-feature-input" placeholder="功能描述2" />
              <button v-if="item.feature2" class="carousel-admin-feature-del" @click="item.feature2 = ''">×</button>
            </div>
            <div class="carousel-admin-feature-tag">
              <input v-model="item.feature3" class="carousel-admin-feature-input" placeholder="功能描述3" />
              <button v-if="item.feature3" class="carousel-admin-feature-del" @click="item.feature3 = ''">×</button>
            </div>
          </div>
          <!-- 高级设置（背景色、显示状态） -->
          <div class="carousel-admin-form-row carousel-admin-advanced">
            <div class="carousel-admin-field">
              <label>图标背景</label>
              <input v-model="item.iconBg" class="carousel-admin-input carousel-admin-input-sm" placeholder="linear-gradient(135deg, #ef4444, #f97316)" />
            </div>
            <div class="carousel-admin-field">
              <label>卡片背景</label>
              <input v-model="item.cardBg" class="carousel-admin-input carousel-admin-input-sm" placeholder="linear-gradient(135deg, #1e1b4b, #4c1d95)" />
            </div>
            <div class="carousel-admin-field carousel-admin-field-toggle">
              <label>显示</label>
              <button
                class="carousel-admin-toggle"
                :class="{ active: item.isVisible }"
                @click="item.isVisible = !item.isVisible"
              >
                {{ item.isVisible ? '显示' : '隐藏' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="carousel-admin-card-actions">
          <button class="carousel-admin-action-btn" @click="moveCard(idx, -1)" :disabled="idx === 0" title="上移">↑</button>
          <button class="carousel-admin-action-btn" @click="moveCard(idx, 1)" :disabled="idx === carouselList.length - 1" title="下移">↓</button>
          <button class="carousel-admin-action-btn carousel-admin-action-delete" @click="removeCard(idx)" title="删除">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createDiscreteApi } from 'naive-ui'
import { useHttpGet, useHttpPost } from '~/composables/useHttp'

const { message } = createDiscreteApi(['message'])

useHead({ title: '轮播图管理 - 后台' })

const saving = ref(false)

// 轮播图列表数据（对齐数据库表 osh_home_page_carousel）
const carouselList = ref([])

// 加载数据
async function loadCarouselList() {
  const { data, error } = await useHttpGet('carouselList', '/homepage/carousel/list', { $: true })
  if (error.value) {
    message.error('获取轮播图列表失败')
    return
  }
  // 后端 isVisible 是 Integer(1/0)，前端用 boolean 方便绑定
  carouselList.value = (data.value || []).map(item => ({
    ...item,
    isVisible: item.isVisible === 1 || item.isVisible === true,
  }))
}

function addNewCard() {
  carouselList.value.push({
    id: null,
    sort: carouselList.value.length + 1,
    emoji: '🆕',
    iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    cardBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
    title: '',
    subtitle: '',
    btnText: '查看详情',
    path: '/',
    feature1: '',
    feature2: '',
    feature3: '',
    isVisible: true,
  })
}

function moveCard(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= carouselList.value.length) return
  const items = carouselList.value
  const temp = items[index]
  items[index] = items[newIndex]
  items[newIndex] = temp
  // 更新 sort
  items.forEach((item, i) => { item.sort = i + 1 })
  carouselList.value = [...items]
}

function removeCard(index) {
  carouselList.value.splice(index, 1)
  carouselList.value.forEach((item, i) => { item.sort = i + 1 })
}

async function saveAll() {
  saving.value = true
  try {
    // 前端 isVisible 是 boolean，后端需要 Integer(1/0)
    const payload = carouselList.value.map((item, i) => ({
      ...item,
      sort: i + 1,
      isVisible: item.isVisible ? 1 : 0,
    }))
    const { error } = await useHttpPost('carouselSaveAll', '/homepage/carousel/saveAll', {
      $: true,
      body: payload,
    })
    if (error.value) {
      message.error('保存失败：' + (error.value || '未知错误'))
    } else {
      message.success('保存成功')
      // 重新加载以获取后端生成的 id
      await loadCarouselList()
    }
  } catch (e) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCarouselList()
})
</script>

<style scoped>
.carousel-admin-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 60px;
  min-height: 100vh;
  background: #f9fafb;
}

/* 头部 */
.carousel-admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.carousel-admin-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.carousel-admin-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.carousel-admin-back:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.carousel-admin-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.carousel-admin-count {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 12px;
}

.carousel-admin-header-right {
  display: flex;
  gap: 10px;
}

.carousel-admin-add-btn {
  padding: 8px 18px;
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.carousel-admin-add-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f3ff;
}

.carousel-admin-save-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.carousel-admin-save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.carousel-admin-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 卡片列表 */
.carousel-admin-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.carousel-admin-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  transition: all 0.2s;
}

.carousel-admin-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
}

/* 左侧 */
.carousel-admin-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.carousel-admin-card-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-admin-card-preview {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-admin-card-emoji {
  font-size: 26px;
}

/* 中间表单 */
.carousel-admin-card-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.carousel-admin-form-row {
  display: flex;
  gap: 8px;
}

.carousel-admin-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  transition: border-color 0.2s;
}

.carousel-admin-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.08);
}

.carousel-admin-input-title {
  font-weight: 600;
  font-size: 15px;
}

.carousel-admin-input-emoji {
  width: 52px;
  flex: none;
  text-align: center;
  font-size: 18px;
}

.carousel-admin-input-sm {
  font-size: 12px;
  padding: 6px 10px;
}

/* 功能标签 */
.carousel-admin-features {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.carousel-admin-features-label {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.carousel-admin-feature-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 3px 6px;
  transition: border-color 0.2s;
}

.carousel-admin-feature-tag:focus-within {
  border-color: #6366f1;
}

.carousel-admin-feature-input {
  width: 72px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #374151;
  padding: 2px 4px;
  outline: none;
}

.carousel-admin-feature-del {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s;
}

.carousel-admin-feature-del:hover {
  background: #fecaca;
  color: #ef4444;
}

/* 高级设置 */
.carousel-admin-advanced {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.carousel-admin-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.carousel-admin-field label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.carousel-admin-field-toggle {
  flex: none;
  width: 60px;
  align-items: center;
}

.carousel-admin-toggle {
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  color: #9ca3af;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}

.carousel-admin-toggle.active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #10b981;
}

/* 右侧操作 */
.carousel-admin-card-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.carousel-admin-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.carousel-admin-action-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f3ff;
}

.carousel-admin-action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-admin-action-delete:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

/* 响应式 */
@media (max-width: 768px) {
  .carousel-admin-page {
    padding: 16px 12px 40px;
  }
  .carousel-admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .carousel-admin-card {
    flex-direction: column;
    gap: 12px;
  }
  .carousel-admin-card-left {
    width: 100%;
  }
  .carousel-admin-card-actions {
    flex-direction: row;
    width: 100%;
    justify-content: flex-end;
  }
  .carousel-admin-form-row {
    flex-direction: column;
  }
  .carousel-admin-advanced {
    flex-direction: column;
  }
}
</style>
