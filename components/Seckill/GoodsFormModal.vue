<template>
  <n-modal
    :show="show"
    :title="formData.id ? '编辑秒杀商品' : '新增秒杀商品'"
    preset="card"
    style="width: 580px; max-width: 96vw;"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="90px">

      <n-form-item label="课程ID" path="courseId">
        <n-input-number
          v-model:value="formData.courseId"
          placeholder="填写关联课程的ID"
          style="width: 100%"
          :min="1"
        />
      </n-form-item>

      <n-form-item label="商品名称" path="goodsName">
        <n-input v-model:value="formData.goodsName" placeholder="请输入商品名称，最多100字" maxlength="100" show-count />
      </n-form-item>

      <n-form-item label="商品描述" path="goodsDesc">
        <n-input
          v-model:value="formData.goodsDesc"
          type="textarea"
          placeholder="选填，最多500字"
          maxlength="500"
          show-count
          :rows="3"
        />
      </n-form-item>

      <n-form-item label="原价" path="originalPrice">
        <n-input-number
          v-model:value="formData.originalPrice"
          :min="0.01" :precision="2"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </n-input-number>
      </n-form-item>

      <n-form-item label="秒杀价" path="seckillPrice">
        <n-input-number
          v-model:value="formData.seckillPrice"
          :min="0.01" :precision="2"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </n-input-number>
      </n-form-item>

      <n-form-item label="库存" path="stock">
        <n-input-number v-model:value="formData.stock" :min="formData.id ? 0 : 1" style="width: 100%" />
      </n-form-item>

      <n-form-item label="每人限购" path="limitCount">
        <n-input-number v-model:value="formData.limitCount" :min="1" placeholder="不填则不限" style="width: 100%" />
      </n-form-item>

      <n-form-item label="秒杀类型" path="seckillType">
        <n-select
          v-model:value="formData.seckillType"
          :options="typeOptions"
          placeholder="请选择秒杀类型"
        />
      </n-form-item>

      <n-form-item label="开始时间" path="startTime">
        <n-date-picker
          v-model:value="formData.startTimeMs"
          type="datetime"
          style="width: 100%"
          placeholder="请选择秒杀开始时间"
          :is-date-disabled="disablePastDate"
        />
      </n-form-item>

      <n-form-item label="结束时间" path="endTime">
        <n-date-picker
          v-model:value="formData.endTimeMs"
          type="datetime"
          style="width: 100%"
          placeholder="请选择秒杀结束时间"
          :is-date-disabled="disablePastDate"
        />
      </n-form-item>

      <n-form-item label="排序" path="sort">
        <n-input-number v-model:value="formData.sort" :min="0" style="width: 100%" placeholder="数字越大越靠前" />
      </n-form-item>

      <n-form-item label="备注" path="remark">
        <n-input v-model:value="formData.remark" placeholder="选填，最多500字" maxlength="500" show-count />
      </n-form-item>

    </n-form>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          {{ formData.id ? '保存修改' : '确认新增' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import {
  NModal, NForm, NFormItem, NInput, NInputNumber,
  NSelect, NButton, NDatePicker, createDiscreteApi,
} from 'naive-ui'

const props = defineProps({
  show: Boolean,
  initData: { type: Object, default: null },
})
const emit = defineEmits(['update:show', 'success'])

const { message } = createDiscreteApi(['message'])
const { seckillFetch } = useSeckillFetch()
const formRef = ref(null)
const loading = ref(false)

const typeOptions = [
  { label: '普通秒杀', value: 1 },
  { label: '限时特惠', value: 2 },
  { label: '新人专享', value: 3 },
]

const defaultForm = () => ({
  id: null,
  courseId: null,
  goodsName: '',
  goodsDesc: '',
  originalPrice: null,
  seckillPrice: null,
  stock: null,
  limitCount: null,
  seckillType: 1,
  startTimeMs: null,  // n-date-picker 用毫秒时间戳
  endTimeMs: null,
  sort: 0,
  remark: '',
})

const formData = reactive(defaultForm())

const rules = {
  courseId:      [{ required: true, type: 'number', message: '请填写课程ID', trigger: ['blur', 'change'] }],
  goodsName:     [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  originalPrice: [{ required: true, type: 'number', message: '请填写原价', trigger: ['blur', 'change'] }],
  seckillPrice:  [{ required: true, type: 'number', message: '请填写秒杀价', trigger: ['blur', 'change'] }],
  stock:         [{ required: true, type: 'number', message: '请填写库存', trigger: ['blur', 'change'] }],
  seckillType:   [{ required: true, type: 'number', message: '请选择秒杀类型', trigger: 'change' }],
  startTimeMs:   [{ required: true, type: 'number', message: '请选择开始时间', trigger: 'change' }],
  endTimeMs:     [{ required: true, type: 'number', message: '请选择结束时间', trigger: 'change' }],
}

function disablePastDate(ts) {
  return ts < Date.now() - 86400000
}

// 弹窗打开时回填
watch(() => props.show, (val) => {
  if (!val) return
  if (props.initData) {
    const d = props.initData
    Object.assign(formData, {
      ...defaultForm(),
      ...d,
      startTimeMs: d.startTime ? new Date(d.startTime.replace(' ', 'T')).getTime() : null,
      endTimeMs:   d.endTime   ? new Date(d.endTime.replace('   ', 'T')).getTime() : null,
    })
  } else {
    Object.assign(formData, defaultForm())
  }
})

// 格式化时间戳为后端需要的字符串
function fmtTime(ms) {
  if (!ms) return null
  const d = new Date(ms)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }

  // 业务校验
  if (formData.seckillPrice >= formData.originalPrice) {
    message.warning('秒杀价必须小于原价')
    return
  }
  if (formData.endTimeMs <= formData.startTimeMs) {
    message.warning('结束时间必须晚于开始时间')
    return
  }

  const body = {
    ...formData,
    startTime: fmtTime(formData.startTimeMs),
    endTime:   fmtTime(formData.endTimeMs),
  }
  delete body.startTimeMs
  delete body.endTimeMs

  loading.value = true
  try {
    const url = formData.id ? '/seckill/goods/update' : '/seckill/goods/add'
    const res = await seckillFetch(url, { method: 'POST', body })
    if (res?.code === 200) {
      message.success(formData.id ? '修改成功' : '新增成功')
      emit('update:show', false)
      emit('success')
    } else {
      message.error(res?.msg || (formData.id ? '修改失败' : '新增失败'))
    }
  } catch (e) {
    message.error(e?.data?.msg || (formData.id ? '修改失败' : '新增失败'))
  } finally {
    loading.value = false
  }
}
</script>
