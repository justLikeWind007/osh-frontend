<template>
  <div class="page-wrapper">
    <div class="breadcrumb-box">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <nuxt-link to="/">首页</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <nuxt-link to="/feedback/list">反馈列表</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>提交反馈</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="form-container">
      <h1 class="page-title">✍️ 提交反馈</h1>
      <p class="page-desc">感谢您的反馈！您的意见对我们非常重要。</p>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <!-- 分类选择 -->
        <n-form-item label="反馈类型" path="categoryId">
          <div class="feedback-type-field">
            <n-select
              v-model:value="form.categoryId"
              class="feedback-select"
              :options="categorySelectOptions"
              placeholder="请选择反馈类型"
              clearable
              @update:value="handleCategorySelect"
            />
            <div v-if="currentCategoryDescription" class="type-helper-desc">{{ currentCategoryDescription }}</div>
          </div>
        </n-form-item>

        <!-- 标题 -->
        <n-form-item label="标题" path="title">
          <n-input
            v-model:value="form.title"
            placeholder="请输入反馈标题（最多128字符）"
            maxlength="128"
            show-count
          />
        </n-form-item>

        <!-- 内容 -->
        <n-form-item label="详细描述" path="content">
          <n-input
            v-model:value="form.content"
            type="textarea"
            :rows="8"
            placeholder="请详细描述您的反馈（最多1000字符）"
            maxlength="1000"
            show-count
          />
        </n-form-item>

        <!-- 提交按钮 -->
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSubmit" :loading="submitting">
              提交反馈
            </n-button>
            <n-button @click="handleSaveDraft">
              保存草稿
            </n-button>
            <n-button @click="handleReset">
              重置
            </n-button>
            <n-button @click="$router.back()">
              返回
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NForm, NFormItem, NInput, NButton, NSpace, NBreadcrumb, NBreadcrumbItem, NSelect } from 'naive-ui'
import {
  apiGetFeedbackCategories,
  apiCreateFeedback,
  assertAssistantResponseSuccess,
  resolveFeedbackCategoryIcon,
  resolveFeedbackErrorMessage
} from '~/composables/assistant'
import { useHasAuth } from '~/composables/useAuth'

const router = useRouter()
const message = useMessage()

const categories = ref([])
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  categoryId: null,
  title: '',
  content: '',
  pagePath: ''
})

const categorySelectOptions = computed(() => categories.value.map(category => ({
  label: `${resolveFeedbackCategoryIcon(category)} ${category.name}`,
  value: category.id,
})))

const currentCategoryDescription = computed(() => categories.value
  .find(category => category.id === form.value.categoryId)?.description || '')

const rules = {
  categoryId: { 
    required: true, 
    message: '请选择反馈类型', 
    trigger: 'change',
    validator: (rule, value) => {
      if (value === null || value === undefined || value === '') {
        return new Error('请选择反馈类型')
      }
      return true
    }
  },
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 128, message: '标题不能超过128字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { max: 1000, message: '内容不能超过1000字符', trigger: 'blur' }
  ]
}

onMounted(async () => {
  useHasAuth()
  await loadCategories()
  loadDraft()
  
  // 自动填充页面路径
  if (process.client) {
    form.value.pagePath = document.referrer || window.location.href
  }
})

async function loadCategories() {
  try {
    const res = await apiGetFeedbackCategories()
    categories.value = res.data || []
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载分类失败'))
    console.error('加载分类失败:', error)
  }
}

function loadDraft() {
  if (process.client) {
    const userId = localStorage.getItem('userId') || 'guest'
    const draft = localStorage.getItem(`feedback_draft_${userId}`)
    if (draft) {
      try {
        const draftData = JSON.parse(draft)
        form.value = { ...form.value, ...draftData }
        message.info('已加载草稿')
      } catch (error) {
        console.error('加载草稿失败:', error)
      }
    }
  }
}

function handleSaveDraft() {
  if (process.client) {
    const userId = localStorage.getItem('userId') || 'guest'
    localStorage.setItem(`feedback_draft_${userId}`, JSON.stringify(form.value))
    message.success('草稿已保存')
  }
}

async function handleSubmit() {
  try {
    const token = useCookie('token')
    if (!token.value) {
      return useHasAuth()
    }

    await formRef.value?.validate()
    submitting.value = true

    const createdFeedback = assertAssistantResponseSuccess(
      await apiCreateFeedback({
        categoryId: form.value.categoryId,
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        pagePath: form.value.pagePath
      }),
      '提交反馈失败'
    )

    // 清除草稿
    if (process.client) {
      const userId = localStorage.getItem('userId') || 'guest'
      localStorage.removeItem(`feedback_draft_${userId}`)
    }

    message.success('提交成功')

    if (createdFeedback?.id) {
      await router.push(`/feedback/detail/${createdFeedback.id}?created=1`)
      return
    }
    await router.push('/feedback/my')
  } catch (error) {
    if (Array.isArray(error)) {
      return
    }
    console.error('提交反馈失败:', error)
    message.error(resolveFeedbackErrorMessage(error, '提交失败'))
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.restoreValidation()
  form.value = {
    categoryId: null,
    title: '',
    content: '',
    pagePath: form.value.pagePath
  }
}

function handleCategorySelect(categoryId) {
  form.value.categoryId = categoryId
  formRef.value?.restoreValidation()
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  padding: 24px 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 40px);
}

.breadcrumb-box {
  margin-bottom: 20px;
}

.form-container {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 32px 0;
}

.feedback-type-field {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.type-helper-desc {
  display: block;
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

:deep(.feedback-select .n-base-selection) {
  border-radius: 12px;
  min-height: 40px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: none;
}

:deep(.feedback-select .n-base-selection-label) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

:deep(.feedback-select .n-base-selection-input) {
  min-height: 40px;
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

/* 响应式 */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 12px;
  }
  
  .form-container {
    padding: 24px 16px;
  }
}
</style>
