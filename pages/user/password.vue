<template>
    <div class="password-container">
        <h3 class="page-title">修改密码</h3>
        <n-form ref="formRef" :model="form" :rules="rules" label-width="90" label-placement="left" class="password-form">
            <n-form-item label="原密码" path="opassword">
                <n-input
                    v-model:value="form.opassword"
                    placeholder="请输入原密码"
                    type="password"
                    show-password-on="click"
                />
            </n-form-item>
            <n-form-item label="新密码" path="password">
                <n-input
                    v-model:value="form.password"
                    placeholder="8-20位，须含大小写字母和数字"
                    type="password"
                    show-password-on="click"
                />
            </n-form-item>
            <n-form-item label="确认新密码" path="repassword">
                <n-input
                    v-model:value="form.repassword"
                    placeholder="再次输入新密码"
                    type="password"
                    show-password-on="click"
                    :disabled="!form.password"
                />
            </n-form-item>
            <n-form-item>
                <n-button type="primary" :loading="loading" @click="onSubmit" class="submit-btn">
                    确认修改
                </n-button>
            </n-form-item>
        </n-form>
    </div>
</template>

<script setup>
import {
    NForm,
    NFormItem,
    NInput,
    NButton,
    createDiscreteApi
} from 'naive-ui'

useHead({ title: '修改密码' })

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
    opassword: '',
    password: '',
    repassword: ''
})

// 与后端 OshUserConstants.PASSWORD_PATTERN 保持一致：
// 8-20位，必须包含大写字母、小写字母、数字，可含特殊字符
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,20}$/

const rules = {
    opassword: [
        { required: true, message: '请输入原密码', trigger: ['blur', 'input'] }
    ],
    password: [
        { required: true, message: '请输入新密码', trigger: ['blur', 'input'] },
        {
            validator(rule, value) {
                return PASSWORD_PATTERN.test(value)
            },
            message: '密码须为 8-20 位，且包含大写字母、小写字母和数字',
            trigger: ['blur', 'input']
        }
    ],
    repassword: [
        { required: true, message: '请再次输入新密码', trigger: ['blur', 'input'] },
        {
            validator(rule, value) {
                return value === form.password
            },
            message: '两次密码输入不一致',
            trigger: ['blur', 'input']
        }
    ]
}

const onSubmit = () => {
    formRef.value?.validate(async (errors) => {
        if (errors) return

        loading.value = true

        const { data, error } = await useupdatePasswordApi({
            opassword: form.opassword,
            password: form.password,
            repassword: form.repassword
        })

        loading.value = false

        if (error.value) return

        const { message } = createDiscreteApi(['message'])
        message.success('密码修改成功，请重新登录')

        // 修改密码后退出登录
        await useLogout()
    })
}

useEnterEvent(() => onSubmit())
</script>

<style scoped>
.password-container {
    padding: 1.5rem 2rem 2rem;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem;
}

.password-form {
    max-width: 460px;
}

.submit-btn {
    min-width: 120px;
}
</style>
