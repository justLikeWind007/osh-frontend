<template>
  <n-modal
    :show="show"
    preset="card"
    :title="form.id ? '编辑题目' : '新增题目'"
    style="width: 640px"
    :segmented="{ content: 'soft', footer: 'soft' }"
    @update:show="$emit('update:show', $event)"
  >
    <n-form label-placement="left" label-width="96">
      <n-form-item label="题型" required>
        <n-select
          v-model:value="form.type"
          :options="typeOptions"
          placeholder="选择题型"
          @update:value="onTypeChange"
        />
      </n-form-item>
      <n-form-item label="题干" required>
        <n-input v-model:value="form.title" type="textarea" placeholder="题目内容（支持简单 HTML）" :autosize="{ minRows: 2, maxRows: 6 }" />
      </n-form-item>
      <n-form-item label="分值" required>
        <n-input-number v-model:value="form.score" :min="1" :max="999" style="width: 100%" />
      </n-form-item>

      <!-- 选项编辑：每项一行，独立输入框 + 删除按钮，底部「+ 添加选项」 -->
      <n-form-item v-if="needsOptions" label="选项" required>
        <div class="option-editor">
          <div
            v-for="(opt, idx) in optionList"
            :key="idx"
            class="option-row"
          >
            <span class="option-letter">{{ letterOf(idx) }}.</span>
            <n-input
              v-model:value="optionList[idx]"
              :placeholder="`选项 ${letterOf(idx)} 内容`"
              class="option-input"
            />
            <n-button
              quaternary
              type="error"
              size="small"
              :disabled="optionList.length <= 2"
              @click="removeOption(idx)"
            >
              删除
            </n-button>
          </div>
          <n-button
            dashed
            block
            :disabled="optionList.length >= 26"
            @click="addOption"
          >
            + 添加选项
          </n-button>
        </div>
      </n-form-item>

      <!-- 单选题答案：从已填选项里点选一个 -->
      <n-form-item v-if="form.type === 'radio'" label="正确答案" required>
        <n-radio-group v-model:value="form.correctAnswer">
          <n-space vertical>
            <n-radio
              v-for="(opt, idx) in optionList"
              :key="idx"
              :value="String(idx)"
            >
              {{ letterOf(idx) }}. {{ opt || '（请先填写选项内容）' }}
            </n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>

      <!-- 多选题答案：从已填选项里勾选多个 -->
      <n-form-item v-else-if="form.type === 'checkbox'" label="正确答案" required>
        <n-checkbox-group v-model:value="checkboxAnswer">
          <n-space vertical>
            <n-checkbox
              v-for="(opt, idx) in optionList"
              :key="idx"
              :value="idx"
            >
              {{ letterOf(idx) }}. {{ opt || '（请先填写选项内容）' }}
            </n-checkbox>
          </n-space>
        </n-checkbox-group>
      </n-form-item>

      <!-- 判断题答案：正确 / 错误 -->
      <n-form-item v-else-if="form.type === 'trueOrfalse'" label="正确答案" required>
        <n-radio-group v-model:value="form.correctAnswer">
          <n-radio value="true">正确</n-radio>
          <n-radio value="false">错误</n-radio>
        </n-radio-group>
      </n-form-item>

      <!-- 填空 / 问答：自由文本 -->
      <n-form-item v-else label="参考答案" :required="form.type !== 'completion'">
        <n-input
          v-model:value="form.correctAnswer"
          type="textarea"
          placeholder="参考文本（用于自动比对或人工阅卷）"
          :autosize="{ minRows: 1, maxRows: 4 }"
        />
      </n-form-item>

      <n-form-item label="备注">
        <n-input v-model:value="form.remark" placeholder="解析或提示（可选）" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="loading" @click="submit">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.option-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.option-letter {
  width: 24px;
  text-align: right;
  color: #666;
  flex: none;
}
.option-input {
  flex: 1;
  min-width: 0;
}
</style>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  createDiscreteApi,
  NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NButton,
  NRadio, NRadioGroup, NCheckbox, NCheckboxGroup,
} from 'naive-ui'
import { apiSaveExamQuestion } from '~/composables/Api/Exam/exam'

const props = defineProps({
  show: Boolean,
  examId: { type: Number, required: true },
  initQuestion: { type: Object, default: null },
})
const emit = defineEmits(['update:show', 'success'])

const { message } = createDiscreteApi(['message'])
const loading = ref(false)

const typeOptions = [
  { label: '单选题', value: 'radio' },
  { label: '多选题', value: 'checkbox' },
  { label: '判断题', value: 'trueOrfalse' },
  { label: '填空题', value: 'completion' },
  { label: '问答题', value: 'answer' },
]

// form.options is kept only for wire compatibility (serialized JSON sent to backend).
// In the UI we edit `optionList` (string[]) directly; serialization happens at submit.
const form = reactive({
  id: null,
  type: 'radio',
  title: '',
  score: 10,
  options: '["A","B","C","D"]',
  correctAnswer: '',
  remark: '',
})

const optionList = ref(['A', 'B', 'C', 'D'])

const needsOptions = computed(() => form.type === 'radio' || form.type === 'checkbox')

function letterOf(idx) {
  return String.fromCharCode(65 + idx) // 0 -> A, 1 -> B, ...
}

// Bridge "0,2" <-> [0, 2] so n-checkbox-group can drive form.correctAnswer.
const checkboxAnswer = computed({
  get() {
    if (!form.correctAnswer) return []
    return form.correctAnswer
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n))
  },
  set(arr) {
    const cleaned = (arr || [])
      .filter((n) => Number.isInteger(n))
      .slice()
      .sort((a, b) => a - b)
    form.correctAnswer = cleaned.join(',')
  },
})

function parseOptionsString(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => (v == null ? '' : String(v)))
  }
  if (typeof raw !== 'string' || !raw.trim()) return null
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return arr.map((v) => (v == null ? '' : String(v)))
  } catch {}
  return null
}

function syncOptionListFromForm() {
  const parsed = parseOptionsString(form.options)
  if (parsed && parsed.length >= 2) {
    optionList.value = parsed
  } else {
    optionList.value = ['A', 'B', 'C', 'D']
  }
}

function addOption() {
  if (optionList.value.length >= 26) return
  optionList.value.push('')
}

function removeOption(idx) {
  if (optionList.value.length <= 2) return
  optionList.value.splice(idx, 1)
  // Re-align correctAnswer to the new indices so we never leave a dangling pointer.
  if (form.type === 'radio') {
    const cur = Number(form.correctAnswer)
    if (!Number.isInteger(cur)) {
      form.correctAnswer = ''
    } else if (cur === idx) {
      form.correctAnswer = ''
    } else if (cur > idx) {
      form.correctAnswer = String(cur - 1)
    }
  } else if (form.type === 'checkbox') {
    const arr = checkboxAnswer.value
    const next = arr
      .filter((i) => i !== idx)
      .map((i) => (i > idx ? i - 1 : i))
    checkboxAnswer.value = next
  }
}

function onTypeChange(newType) {
  // Switching to a type that doesn't reuse the previous answer format ->
  // wipe correctAnswer to avoid sending garbage indices/booleans.
  form.correctAnswer = ''
  if (newType === 'radio' || newType === 'checkbox') {
    if (optionList.value.length < 2) {
      optionList.value = ['A', 'B', 'C', 'D']
    }
  }
}

function reset() {
  form.id = null
  form.type = 'radio'
  form.title = ''
  form.score = 10
  form.options = '["A","B","C","D"]'
  form.correctAnswer = ''
  form.remark = ''
  optionList.value = ['A', 'B', 'C', 'D']
}

function fillFrom(q) {
  if (!q) {
    reset()
    return
  }
  form.id = q.id ?? q.question_id ?? null
  form.type = q.type || 'radio'
  form.title = q.title || ''
  form.score = q.score != null ? Number(q.score) : 10
  if (typeof q.options === 'string') {
    form.options = q.options
  } else if (Array.isArray(q.options)) {
    try {
      form.options = JSON.stringify(q.options)
    } catch {
      form.options = '[]'
    }
  } else {
    form.options = '[]'
  }
  const ca = q.correct_answer ?? q.correctAnswer
  form.correctAnswer = ca != null ? String(ca) : ''
  form.remark = q.remark || ''
  syncOptionListFromForm()
}

watch(
  () => props.show,
  (v) => {
    if (v) fillFrom(props.initQuestion)
  }
)

watch(
  () => props.initQuestion,
  () => {
    if (props.show) fillFrom(props.initQuestion)
  },
  { deep: true }
)

async function submit() {
  if (!form.title.trim()) {
    message.warning('请填写题干')
    return
  }

  // Per-type validation (验证) — these used to be hidden inside the JSON parse step.
  if (needsOptions.value) {
    const cleaned = optionList.value.map((v) => (v == null ? '' : String(v).trim()))
    if (cleaned.length < 2) {
      message.warning('至少需要 2 个选项')
      return
    }
    if (cleaned.some((v) => v === '')) {
      message.warning('选项内容不能为空')
      return
    }
    const set = new Set(cleaned)
    if (set.size !== cleaned.length) {
      message.warning('选项内容不能重复')
      return
    }
    form.options = JSON.stringify(cleaned)

    if (form.type === 'radio') {
      const idx = Number(form.correctAnswer)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cleaned.length) {
        message.warning('请选择正确答案')
        return
      }
    } else {
      // checkbox
      const arr = checkboxAnswer.value
      if (!arr.length) {
        message.warning('请至少勾选一个正确答案')
        return
      }
      if (arr.some((i) => i < 0 || i >= cleaned.length)) {
        message.warning('答案与选项不一致，请重新选择')
        return
      }
    }
  } else if (form.type === 'trueOrfalse') {
    if (form.correctAnswer !== 'true' && form.correctAnswer !== 'false') {
      message.warning('请选择「正确」或「错误」')
      return
    }
  } else if (form.type === 'answer') {
    if (!form.correctAnswer.trim()) {
      message.warning('请填写参考答案')
      return
    }
  }

  loading.value = true
  try {
    const payload = {
      id: form.id || undefined,
      examId: props.examId,
      title: form.title.trim(),
      score: form.score,
      type: form.type,
      remark: form.remark || undefined,
      options: needsOptions.value ? form.options : undefined,
      correctAnswer: form.correctAnswer || undefined,
    }
    const res = await apiSaveExamQuestion(payload)
    if (res?.code === 200) {
      message.success('保存成功')
      emit('update:show', false)
      emit('success')
    } else {
      message.error(res?.msg || '保存失败')
    }
  } catch (e) {
    message.error(e?.data?.msg || e?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>
