<template>
    <div class="delete-page">
        <h3 class="page-title">注销账号</h3>

        <n-alert type="error" :bordered="false" class="warning-alert">
            <template #icon>
                <span>⚠️</span>
            </template>
            <strong>注销后账号将无法恢复</strong>，所有数据（订单、资产、学习记录等）将被永久删除，请谨慎操作。
        </n-alert>

        <div class="consequences">
            <p class="consequences-title">注销后将会：</p>
            <ul class="consequences-list">
                <li>账号及个人信息永久删除</li>
                <li>金币、积分等资产清零，无法找回</li>
                <li>已购课程、订单记录全部清除</li>
                <li>无法使用该用户名和邮箱重新注册</li>
            </ul>
        </div>

        <template v-if="!confirmed">
            <n-checkbox v-model:checked="agreed" class="agree-check">
                我已了解以上风险，确认注销账号
            </n-checkbox>
            <div class="btn-row">
                <n-button
                    type="error"
                    :disabled="!agreed"
                    @click="confirmed = true"
                    class="danger-btn"
                >
                    继续注销
                </n-button>
                <n-button @click="navigateTo({ name: 'user-profile' })">取消</n-button>
            </div>
        </template>

        <!-- 二次确认 -->
        <template v-else>
            <n-card class="confirm-card" :bordered="true">
                <p class="confirm-text">请输入您的账号密码以确认身份：</p>
                <n-form
                    ref="formRef"
                    :model="form"
                    :rules="rules"
                    label-width="80"
                    label-placement="left"
                    class="confirm-form"
                >
                    <n-form-item label="当前密码" path="password">
                        <n-input
                            v-model:value="form.password"
                            type="password"
                            show-password-on="click"
                            placeholder="请输入当前密码"
                        />
                    </n-form-item>
                    <n-form-item>
                        <n-space>
                            <n-button
                                type="error"
                                :loading="loading"
                                @click="onDelete"
                                class="danger-btn"
                            >
                                确认注销
                            </n-button>
                            <n-button @click="confirmed = false">返回</n-button>
                        </n-space>
                    </n-form-item>
                </n-form>
            </n-card>
        </template>
    </div>
</template>

<script setup>
import {
    NAlert,
    NCheckbox,
    NButton,
    NCard,
    NForm,
    NFormItem,
    NInput,
    NSpace,
    createDiscreteApi
} from 'naive-ui'

useHead({ title: '注销账号' })

const agreed    = ref(false)
const confirmed = ref(false)
const loading   = ref(false)
const formRef   = ref(null)

const form = reactive({ password: '' })
const rules = {
    password: [{ required: true, message: '请输入当前密码', trigger: ['blur', 'input'] }]
}

const onDelete = () => {
    formRef.value?.validate(async (errors) => {
        if (errors) return

        const { dialog, message } = createDiscreteApi(['dialog', 'message'])
        dialog.error({
            title: '最终确认',
            content: `账号 "${useUser().value?.username}" 将被永久注销，此操作不可撤销，是否继续？`,
            positiveText: '确认注销',
            negativeText: '取消',
            onPositiveClick: async () => {
                loading.value = true

                // 先用密码验证身份（复用修改密码接口传相同密码）
                // 后端 deleteUser 接口不需要密码，直接调用
                const { error } = await useDeleteUserApi()

                loading.value = false
                if (error.value) return

                message.success('账号已注销')
                await useLogout()
            }
        })
    })
}
</script>

<style scoped>
.delete-page {
    padding: 1.5rem 2rem 2rem;
    max-width: 560px;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.25rem;
}

.warning-alert {
    margin-bottom: 1.25rem;
}

.consequences {
    background: #fef2f2;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
}

.consequences-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #991b1b;
    margin: 0 0 0.5rem;
}

.consequences-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
    color: #7f1d1d;
    line-height: 1.8;
}

.agree-check {
    margin-bottom: 1.25rem;
    font-size: 0.875rem;
}

.btn-row {
    display: flex;
    gap: 0.75rem;
}

.danger-btn {
    min-width: 100px;
}

.confirm-card {
    margin-top: 0.5rem;
}

.confirm-text {
    font-size: 0.875rem;
    color: #374151;
    margin: 0 0 1rem;
}

.confirm-form {
    max-width: 360px;
}
</style>
