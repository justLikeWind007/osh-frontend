<template>
    <div class="profile-page">
        <h3 class="page-title">基本信息</h3>

        <!-- 头像上传 -->
        <n-form-item label="头像" label-width="90" label-placement="left" class="avatar-item">
            <div class="avatar-wrap">
                <n-avatar
                    round
                    :size="72"
                    :src="avatarPreview"
                    :fallback-src="defaultAvatar"
                    class="avatar-preview"
                />
                <div class="avatar-upload-area">
                    <Uploader v-model="form.avatar" />
                    <span class="avatar-tip">支持 JPG、PNG、GIF，建议 200×200</span>
                </div>
            </div>
        </n-form-item>

        <n-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90"
            label-placement="left"
            class="info-form"
        >
            <!-- 用户名（只读） -->
            <n-form-item label="用户名">
                <n-input :value="user?.username" disabled />
                <template #feedback>
                    <span class="field-tip">用户名创建后不可修改</span>
                </template>
            </n-form-item>

            <!-- 邮箱（只读） -->
            <n-form-item label="邮箱">
                <n-input :value="user?.email || '未绑定'" disabled />
            </n-form-item>

            <!-- 昵称 -->
            <n-form-item label="昵称" path="nickname">
                <n-input
                    v-model:value="form.nickname"
                    placeholder="请输入昵称"
                    maxlength="20"
                    show-count
                />
            </n-form-item>

            <!-- 性别 -->
            <n-form-item label="性别" path="sex">
                <n-radio-group v-model:value="form.sex" name="sex">
                    <n-space>
                        <n-radio v-for="opt in sexOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </n-radio>
                    </n-space>
                </n-radio-group>
            </n-form-item>

            <!-- 个人简介 -->
            <n-form-item label="个人简介" path="introduction">
                <n-input
                    v-model:value="form.introduction"
                    type="textarea"
                    placeholder="介绍一下自己吧..."
                    :rows="3"
                    maxlength="100"
                    show-count
                />
            </n-form-item>

            <!-- 用户状态（只读展示） -->
            <n-form-item label="账号状态">
                <n-tag :type="statusTag.type" :bordered="false" size="medium">
                    {{ statusTag.text }}
                </n-tag>
                <span class="status-tip">{{ statusTag.tip }}</span>
            </n-form-item>

            <n-form-item>
                <n-button
                    type="primary"
                    :loading="loading"
                    @click="onSubmit"
                    class="submit-btn"
                >
                    保存修改
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
    NRadio,
    NRadioGroup,
    NButton,
    NSpace,
    NTag,
    NAvatar,
    createDiscreteApi
} from 'naive-ui'

useHead({ title: '基本信息' })

const user = useUser()
const formRef = ref(null)
const loading = ref(false)
const defaultAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=osh'

const form = reactive({
    avatar:       user.value?.avatar       || '',
    nickname:     user.value?.nickname     || '',
    sex:          user.value?.sex          || '未知',
    introduction: user.value?.introduction || '',
})

// 头像预览：上传组件返回对象时取 previewUrl，否则直接用字符串 URL
const avatarPreview = computed(() => {
    if (form.avatar && typeof form.avatar === 'object') {
        return form.avatar.previewUrl || form.avatar.url || ''
    }
    return form.avatar || user.value?.avatar || ''
})

const sexOptions = [
    { label: '未知', value: '未知' },
    { label: '男',   value: '男'   },
    { label: '女',   value: '女'   },
]

// 根据 violationCount 计算账号状态
// 0 → 正常；1-2 → 警示用户；3+ → 已拉黑
const statusTag = computed(() => {
    const count = user.value?.violationCount ?? 0
    if (count >= 3) {
        return { type: 'error',   text: '已拉黑', tip: '账号存在严重违规，部分功能已受限' }
    }
    if (count >= 1) {
        return { type: 'warning', text: '警示中', tip: `已有 ${count} 次违规记录，请遵守社区规范` }
    }
    return { type: 'success', text: '正常', tip: '账号状态良好，无违规记录' }
})

const rules = {
    nickname: [
        { required: true, message: '昵称不能为空', trigger: ['blur', 'input'] },
        { min: 1, max: 20, message: '昵称长度 1~20 个字符', trigger: ['blur', 'input'] },
    ],
}

const onSubmit = () => {
    formRef.value?.validate(async (errors) => {
        if (errors) return

        loading.value = true

        // 后端 UserUpdateInfoDTO 接受 avatar / nickname / sex
        // introduction 后端暂不支持，不传
        // avatar：上传组件返回对象时取 previewUrl，否则直接用字符串
        const avatarUrl = typeof form.avatar === 'object'
            ? (form.avatar?.previewUrl || form.avatar?.url || '')
            : (form.avatar || '')

        const { error } = await useUpdateUserInfoApi({
            avatar:   avatarUrl,
            nickname: form.nickname,
            sex:      form.sex,
        })

        loading.value = false
        if (error.value) return

        const { message } = createDiscreteApi(['message'])
        message.success('保存成功')
        await useRefreshUserInfo()
    })
}
</script>

<style scoped>
.profile-page {
    padding: 1.5rem 2rem 2rem;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem;
}

.info-form {
    max-width: 480px;
}

.field-tip {
    font-size: 0.72rem;
    color: #9ca3af;
}

.status-tip {
    font-size: 0.75rem;
    color: #6b7280;
    margin-left: 0.75rem;
    align-self: center;
}

.submit-btn {
    min-width: 120px;
}

/* 头像区域 */
.avatar-item {
    margin-bottom: 0.5rem;
}

.avatar-wrap {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
}

.avatar-preview {
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.avatar-upload-area {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.avatar-tip {
    font-size: 0.72rem;
    color: #9ca3af;
}
</style>
