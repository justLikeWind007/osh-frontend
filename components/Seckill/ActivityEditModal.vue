<template>
  <n-modal
    :show="show"
    title="修改秒杀活动"
    preset="card"
    style="width: 700px; max-width: 95vw;"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <n-form ref="formRef" :model="formData" label-placement="left" label-width="100px">

      <!-- 活动标题 -->
      <n-form-item label="活动标题" path="title">
        <n-input v-model:value="formData.title" placeholder="请输入活动标题" />
      </n-form-item>

      <!-- 开始时间 -->
      <n-form-item label="开始时间">
        <n-date-picker
          v-model:value="formData.startTimeTs"
          type="datetime"
          style="width:100%"
          @update:value="formData.startTime = tsToStr($event)"
        />
      </n-form-item>

      <!-- 结束时间 -->
      <n-form-item label="结束时间">
        <n-date-picker
          v-model:value="formData.endTimeTs"
          type="datetime"
          style="width:100%"
          @update:value="formData.endTime = tsToStr($event)"
        />
      </n-form-item>

      <!-- 支付超时 -->
      <n-form-item label="支付超时(分)">
        <n-input-number
          v-model:value="formData.payTimeoutMin"
          :min="1" :max="60"
          style="width:100%"
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
              <span class="item-index">
                商品 {{ idx + 1 }}
                <span v-if="item.id" class="item-id-tag">ID: {{ item.id }}</span>
              </span>
              <n-button size="tiny" type="error" text @click="removeItem(idx)">删除</n-button>
            </div>
            <div class="item-fields">
              <n-form-item label="商品池ID" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.seckillGoodsId" :min="1" style="width:100%" placeholder="商品池ID" />
              </n-form-item>
              <n-form-item label="秒杀价" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.seckillPrice" :min="0.01" :precision="2" style="width:100%">
                  <template #prefix>¥</template>
                </n-input-number>
              </n-form-item>
              <n-form-item label="库存" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.totalStock" :min="1" style="width:100%" />
              </n-form-item>
              <n-form-item label="限购数" :show-feedback="false" label-placement="left" label-width="72px">
                <n-input-number v-model:value="item.limitPerUser" :min="1" style="width:100%" />
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
      <div style="display:flex;justify-content:flex-end;gap:8px;align-items:center">
        <span style="font-size:12px;color:#f59e0b;margin-right:auto">
          ⚠️ 仅草稿状态可修改，商品明细将全量替换
        </span>
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">保存修改</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { NModal, NForm, NFormItem, NInput, NInputNumber, NDatePicker, NButton, createDiscreteApi } from 'naive-ui'

defineOptions({ ssr: false })

const props = defineProps({
  show: Boolean,
  activity: { type: Object, default: null }, // 传入当前活动数据
})
const emit = defineEmits(['update:show', 'success'])

const { message } = createDiscreteApi(['message'])
const formRef = ref(null)
const loading = ref(false)

// 时间戳转字符串
function tsToStr(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 字符串转时间戳
function strToTs(s) {
  if (!s) return null
  return new Date(s.replace(' ', 'T')).getTime()
}

const formData = reactive({
  id: null,
  title: '',
  startTime: '',
  startTimeTs: null,
  endTime: '',
  endTimeTs: null,
  payTimeoutMin: 15,
  items: [],
})

// 弹窗打开时回填数据
watch(() => props.show, (val) => {
  if (!val || !props.activity) return
  const a = props.activity
  formData.id           = a.id
  formData.title        = a.title || ''
  formData.startTime    = a.startTime || ''
  formData.startTimeTs  = strToTs(a.startTime)
  formData.endTime      = a.endTime || ''
  formData.endTimeTs    = strToTs(a.endTime)
  formData.payTimeoutMin = a.payTimeoutMin || 15
  // 回填商品明细
  formData.items = (a.items || []).map(item => ({
    id:             item.id,
    seckillGoodsId: item.seckillGoodsId,
    seckillPrice:   item.seckillPrice,
    totalStock:     item.totalStock,
    limitPerUser:   item.limitPerUser ?? 1,
    sort:           item.sort ?? 0,
  }))
})

function addItem() {
  formData.items.push({
    id: null,
    seckillGoodsId: null,
    seckillPrice: null,
    totalStock: null,
    limitPerUser: 1,
    sort: formData.items.length,
  })
}

function removeItem(idx) {
  formData.items.splice(idx, 1)
}

async function handleSubmit() {
  if (!formData.id) { message.error('活动ID缺失'); return }

  // 校验商品明细
  for (const [i, item] of formData.items.entries()) {
    if (!item.seckillGoodsId) { message.error(`商品 ${i+1}：请填写商品池ID`); return }
    if (!item.seckillPrice || item.seckillPrice <= 0) { message.error(`商品 ${i+1}：秒杀价必须大于0`); return }
    if (!item.totalStock || item.totalStock < 1) { message.error(`商品 ${i+1}：库存至少为1`); return }
  }

  loading.value = true
  try {
    const token = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1] || ''
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8081/pc' : 'http://43.242.200.25:8081/pc'

    const body = {
      id: formData.id,
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
      payTimeoutMin: formData.payTimeoutMin,
      items: formData.items.map((item, idx) => ({
        ...(item.id ? { id: item.id } : {}),
        seckillGoodsId: item.seckillGoodsId,
        seckillPrice:   item.seckillPrice,
        totalStock:     item.totalStock,
        limitPerUser:   item.limitPerUser,
        sort:           idx,
      })),
    }

    const res = await $fetch('/seckill/activity/update', {
      baseURL,
      method: 'POST',
      headers: { appid: 'bd9d01ecc75dbbaaefce', token, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
    })

    if (res?.code === 200) {
      message.success('修改成功')
      emit('update:show', false)
      emit('success')
    } else {
      message.error(res?.msg || '修改失败')
    }
  } catch (e) {
    message.error(e?.data?.msg || '修改失败')
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
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-id-tag {
  font-size: 11px;
  font-weight: 400;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
}
.item-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
