<template>
    <div class="email-page">
        <h3 class="page-title">修改邮箱</h3>

        <!-- 步骤一：提交新邮箱 -->
        <template v-if="step === 1">
            <p class="step-desc">
                当前邮箱：<strong>{{ user?.email || '未绑定' }}</strong>
            </p>
            <p class="step-desc sub">
                填写当前账号的唯一标识（uniqueId）和新邮箱，系统将向新邮箱发送验证邮件。
            </p>

            <n-form
                ref="step1Ref"
                :model="step1Form"
                :rules="step1Rules"
                label-width="110"
                label-placement="left"
                class="email-form"
            >
                <n-form-item label="账号唯一标识" path="uniqueId">
                    <n-input
                        v-model:value="step1Form.uniqueId"
                        placeholder="请输入账号 uniqueId"
                    />
                    <template #feedback>
                        <span class="field-tip">uniqueId 可在账号注册邮件中查看</span>
                    </template>
                </n-form-item>
                <n-form-item label="新邮箱" path="newEmail">
                    <n-input
                        v-model:value="step1Form.newEmail"
                        placeholder="请输入新邮箱地址"
                    />
                </n-form-item>
                <n-form-item>
                    <n-button type="primary" :loading="loading" @click="submitStep1" class="submit-btn">
                        发送验证邮件
                    </n-button>
                </n-form-item>
            </n-form>
        </template>

        <!-- 步骤二：填写邮件中的 uniqueId 完成验证 -->
        <template v-if="step === 2">
            <n-result status="info" title="验证邮件已发送" :description="`请查收发送至 ${step1Form.newEmail} 的验证邮件，将邮件中的唯一标识填入下方完成改绑。`">
                <template #footer>
                    <n-form
                        ref="step2Ref"
                        :model="step2Form"
                        :rules="step2Rules"
                        label-width="110"
                        label-placement="left"
                        class="email-form"
                        style="margin-top: 1.5rem; text-align: left;"
                    >
                        <n-form-item label="邮件唯一标识" path="uniqueId">
                            <n-input
                                v-model:value="step2Form.uniqueId"
                                placeholder="请输入邮件中的 uniqueId"
                            />
                        </n-form-item>
                        <n-form-item>
                            <n-space>
                                <n-button type="primary" :loading="loading" @click="submitStep2" class="submit-btn">
                                    确认改绑
                                </n-button>
                                <n-button @click="step = 1">重新发送</n-button>
                            </n-space>
                        </n-form-item>
                    </n-form>
                </template>
            </n-result>
        </template>

        <!-- 步骤三：改绑成功 -->
        <template v-if="step === 3">
            <n-result
                status="success"
                title="邮箱改绑成功"
                description="您的邮箱已成功更新，请重新登录。"
            >
                <template #footer>
                    <n-button type="primary" @click="handleDone">重新登录</n-button>
                </template>
            </n-result>
        </template>
    </div>
</template>

<script setup>
import {
    NForm,
    NFormItem,
    NInput,
    NButton,
    NSpace,
    NResult,
    createDiscreteApi
} from 'naive-ui'

useHead({ title: '修改邮箱' })

const user = useUser()
const step = ref(1)
const loading = ref(false)

// ── 步骤一 ──
const step1Ref = ref(null)
const step1Form = reactive({ uniqueId: '', newEmail: '' })
const step1Rules = {
    uniqueId: [{ required: true, message: '请输入账号唯一标识', trigger: ['blur', 'input'] }],
    newEmail: [
        { required: true, message: '请输入新邮箱', trigger: ['blur', 'input'] },
        {
            validator: (_, v) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v),
            message: '请输入有效的邮箱格式',
            trigger: ['blur', 'input']
        }
    ]
}

const submitStep1 = () => {
    step1Ref.value?.validate(async (errors) => {
        if (errors) return
        loading.value = true

        const { error } = await useChangeEmailSubmitApi({
            uniqueId: step1Form.uniqueId,
            newEmail: step1Form.newEmail,
        })

        loading.value = false
        if (error.value) return

        const { message } = createDiscreteApi(['message'])
        message.success('验证邮件已发送，请查收')
        step.value = 2
    })
}

// ── 步骤二 ──
const step2Ref = ref(null)
const step2Form = reactive({ uniqueId: '' })
const step2Rules = {
    uniqueId: [{ required: true, message: '请输入邮件中的唯一标识', trigger: ['blur', 'input'] }]
}

const submitStep2 = () => {
    step2Ref.value?.validate(async (errors) => {
        if (errors) return
        loading.value = true

        const { error } = await useChangeEmailVerityApi({
            uniqueId: step2Form.uniqueId,
        })

        loading.value = false
        if (error.value) return

        step.value = 3
    })
}

// ── 完成 ──
const handleDone = async () => {
    await useLogout()
}
</script>

<style scoped>
.email-page {
    padding: 1.5rem 2rem 2rem;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem;
}

.step-desc {
    font-size: 0.875rem;
    color: #374151;
    margin: 0 0 0.4rem;
}

.step-desc.sub {
    color: #6b7280;
    margin-bottom: 1.5rem;
}

.email-form {
    max-width: 460px;
}

.field-tip {
    font-size: 0.72rem;
    color: #9ca3af;
}

.submit-btn {
    min-width: 120px;
}
</style>
