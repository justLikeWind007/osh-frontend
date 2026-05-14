<template>
  <n-modal
    :show="show"
    title="新建秒杀活动"
    preset="card"
    style="width: 680px;"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">

      <!-- 活动标题 -->
      <n-form-item label="活动标题" path="title">
        <n-input v-model:value="formData.title" placeholder="请输入活动标题" />
      </n-form-item>

      <!-- 开始时间 -->
      <n-form-item label="开始时间" path="startTime">
        <n-date-picker
          v-model:value="formData.startTimeTs"
          type="datetime"
          style="width:100%"
          placeholder="请选择开始时间"
          @update:value="formData.startTime = tsToStr($event)"
        />
      </n-form-item>

      <!-- 结束时间 -->
      <n-form-item label="结束时间" path="endTime">
        <n-date-picker
          v-model:value="formData.endTimeTs"
          type="datetime"
          style="width:100%"
          placeholder="请选择结束时间"
          @update:value="formData.endTime = tsToStr($event)"
        />
      </n-form-item>

      <!-- 支付超时 -->
      <n-form-item label="支付超时(分)" path="payTimeoutMin">
        <n-input-number
          v-model:value="formData.payTimeoutMin"
          :min="1" :max="60"
          style="width:100%"
          placeholder="抢购成功后的支付截止分钟数"
        />
      </n-form-item>

      <!-- 商品明细 -->
      <n-form-item label="商品明细">
        <div style="width:100%">
          <div
            v-for="(item, idx) in formData.items"
            :key="idx"
            class="item-row"
          >
            <div class="item-row-header">
              <span class="item-index">商品 {{ idx + 1 }}</span>
              <n-button size="tiny" type="error" text @click="removeItem(idx)">删除</n-button>
            </div>
            <div class="item-fields">
              <n-form-item label="商品池ID" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.seckillGoodsId" :min="1" style="width:100%" placeholder="商品池中的ID" />
              </n-form-item>
              <n-form-item label="秒杀价" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.seckillPrice" :min="0.01" :precision="2" style="width:100%">
                  <template #prefix>¥</template>
                </n-input-number>
              </n-form-item>
              <n-form-item label="库存" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.totalStock" :min="1" style="width:100%" placeholder="限量数量" />
              </n-form-item>
              <n-form-item label="限购数" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.limitPerUser" :min="1" style="width:100%" placeholder="每人限购" />
              </n-form-item>
            </div>
          </div>

          <n-button dashed style="width:100%;margin-top:8px" @click="addItem">
            + 添加商品
          </n-button>
        </div>
      </n-form-item>

    </n-form>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确认创建</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { NModal, NForm, NFormItem, NInput, NInputNumber, NDatePicker, NButton, createDiscreteApi } from 'naive-ui'

// 禁用 SSR，避免 NDatePicker 等组件 hydration 不匹配
defineOptions({ ssr: false })

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show', 'success'])

const { message } = createDiscreteApi(['message'])
const formRef = ref(null)
const loading = ref(false)

// 时间戳转后端需要的格式 yyyy-MM-dd HH:mm:ss
function tsToStr(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const defaultItem = () => ({
  seckillGoodsId: null,
  seckillPrice: null,
  totalStock: null,
  limitPerUser: 1,
  sort: 0,
})

const defaultForm = () => ({
  title: '',
  startTime: '',
  startTimeTs: null,
  endTime: '',
  endTimeTs: null,
  payTimeoutMin: 15,
  items: [defaultItem()],
})

const formData = reactive(defaultForm())

const rules = {
  title:         [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  startTime:     [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime:       [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  payTimeoutMin: [{ required: true, type: 'number', message: '请填写支付超时分钟', trigger: 'blur' }],
}

function addItem() {
  formData.items.push(defaultItem())
}

function removeItem(idx) {
  if (formData.items.length === 1) {
    message.warning('至少保留一个商品')
    return
  }
  formData.items.splice(idx, 1)
}

// 重置表单
watch(() => props.show, (val) => {
  if (val) Object.assign(formData, defaultForm())
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  // 校验商品明细
  for (const [i, item] of formData.items.entries()) {
    if (!item.seckillGoodsId) { message.error(`商品 ${i+1}：请填写商品池ID`); return }
    if (!item.seckillPrice)   { message.error(`商品 ${i+1}：请填写秒杀价`);   return }
    if (!item.totalStock)     { message.error(`商品 ${i+1}：请填写库存`);     return }
  }

  loading.value = true
  try {
    const body = {
      title:         formData.title,
      startTime:     formData.startTime,
      endTime:       formData.endTime,
      payTimeoutMin: formData.payTimeoutMin,
      items: formData.items.map((item, idx) => ({
        seckillGoodsId: item.seckillGoodsId,
        seckillPrice:   item.seckillPrice,
        totalStock:     item.totalStock,
        limitPerUser:   item.limitPerUser,
        sort:           idx,
      })),
    }

    // 直接用 $fetch 并手动带 token，避免 useHttp 在异步上下文取不到 token
    const token = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1] || ''
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8081/pc' : 'http://43.242.200.25:8081/pc'

    const res = await $fetch('/seckill/activity/add', {
      baseURL,
      method: 'POST',
      headers: { appid: 'bd9d01ecc75dbbaaefce', token, Authorization: `Bearer ${token}` },
      body,
    })

    if (res?.code === 200) {
      message.success('活动创建成功')
      emit('update:show', false)
      emit('success')
    } else {
      message.error(res?.msg || '创建失败')
    }
  } catch (e) {
    message.error(e?.data?.msg || '创建失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.item-row {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fafafa;
}
.item-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.item-index {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.item-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
