<template>
  <n-modal
    :show="show"
    :title="formData.id ? '编辑秒杀商品' : '新增秒杀商品'"
    preset="card"
    style="width: 560px;"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="90px">

      <!-- 商品类型 -->
      <n-form-item label="商品类型" path="goodsType">
        <n-select
          v-model:value="formData.goodsType"
          :options="typeOptions"
          placeholder="请选择商品类型"
          @update:value="formData.goodsId = null; formData.goodsName = ''; formData.goodsCover = ''; formData.originPrice = 0"
        />
      </n-form-item>

      <!-- 商品名称 -->
      <n-form-item label="商品名称" path="goodsName">
        <n-input v-model:value="formData.goodsName" placeholder="请输入商品名称" />
      </n-form-item>

      <!-- 商品ID -->
      <n-form-item label="商品ID" path="goodsId">
        <n-input-number
          v-model:value="formData.goodsId"
          placeholder="填写对应商品的ID"
          style="width: 100%"
          :min="1"
        />
        <template #feedback>
          <span style="font-size:12px;color:#9ca3af">填写课程/电子书/题库对应表的主键ID</span>
        </template>
      </n-form-item>

      <!-- 封面图 -->
      <n-form-item label="封面图URL" path="goodsCover">
        <n-input v-model:value="formData.goodsCover" placeholder="请输入封面图片地址" />
      </n-form-item>

      <!-- 原价 -->
      <n-form-item label="原价" path="originPrice">
        <n-input-number
          v-model:value="formData.originPrice"
          :min="0" :precision="2"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </n-input-number>
      </n-form-item>

      <!-- 最低秒杀价 -->
      <n-form-item label="最低秒杀价" path="minSeckillPrice">
        <n-input-number
          v-model:value="formData.minSeckillPrice"
          :min="0" :precision="2"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </n-input-number>
        <template #feedback>
          <span style="font-size:12px;color:#9ca3af">活动中具体秒杀价在创建活动时设置</span>
        </template>
      </n-form-item>

      <!-- 排序 -->
      <n-form-item label="排序" path="sort">
        <n-input-number v-model:value="formData.sort" :min="0" style="width: 100%" placeholder="数字越大越靠前" />
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
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, createDiscreteApi } from 'naive-ui'

const props = defineProps({
  show: Boolean,
  initData: { type: Object, default: null }, // 编辑时传入，新增时为 null
})
const emit = defineEmits(['update:show', 'success'])

const { message } = createDiscreteApi(['message'])
const formRef = ref(null)
const loading = ref(false)

const typeOptions = [
  { label: '课程', value: 1 },
  { label: '电子书', value: 2 },
  { label: '商品', value: 3 },
]

const defaultForm = () => ({
  id: null,
  goodsType: 1,
  goodsId: null,
  goodsName: '',
  goodsCover: '',
  originPrice: 0,
  minSeckillPrice: 0,
  sort: 0,
})

const formData = reactive(defaultForm())

const rules = {
  goodsType:       [{ required: true, type: 'number', message: '请选择商品类型', trigger: 'change' }],
  goodsName:       [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  goodsId:         [{ required: true, type: 'number', message: '请填写商品ID', trigger: 'blur' }],
  originPrice:     [{ required: true, type: 'number', message: '请填写原价', trigger: 'blur' }],
  minSeckillPrice: [{ required: true, type: 'number', message: '请填写最低秒杀价', trigger: 'blur' }],
}

// 弹窗打开时回填数据
watch(() => props.show, (val) => {
  if (!val) return
  if (props.initData) {
    Object.assign(formData, { ...defaultForm(), ...props.initData })
  } else {
    Object.assign(formData, defaultForm())
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    if (formData.id) {
      // 编辑 — 调用修改接口
      await useSeckillGoodsUpdateApi({ ...formData })
      message.success('修改成功')
    } else {
      // 新增 — 调用新增接口（1-3 添加商品到商品池）
      await useSeckillGoodsAddApi({ ...formData })
      message.success('新增成功')
    }
    emit('update:show', false)
    emit('success')
  } catch (e) {
    message.error(formData.id ? '修改失败' : '新增失败')
  } finally {
    loading.value = false
  }
}
</script>
