
<template>
    
    <n-form class="login-form" ref="formRef" :model="form" :rules="rules" size="large">
        
        <n-form-item path="email" v-if="type != 'login'" :show-label="false" >
            <n-input v-model:value="form.email" placeholder="邮箱"/>
        </n-form-item>
        
        <n-form-item path="username" :show-label="false"  >
            <n-input v-model:value="form.username" placeholder='用户名' />
        </n-form-item> 

        <n-form-item path="password" :show-label="false" >
                <n-input v-model:value="form.password" placeholder='密码' type="password"/>
        </n-form-item>

        <n-form-item path="repassword" v-if="type != 'login'" :show-label="false"  >
            <n-input v-model:value="form.repassword" placeholder="确认密码" type="password"/>
        </n-form-item>
        
        <n-form-item path="uniqueId" v-if="type != 'login'" :show-label="false" >
            <n-input  v-model:value="form.uniqueId" placeholder="uniqueId" />
            <SendCode  v-if="type != 'login'"   :email="form.email" :username="form.username" :password="form.password" :repassword="form.repassword" />
        </n-form-item>

        <div class="button-container">
            <div class="links">
                <n-button class="go-to-button" quaternary type="primary" size="tiny" @click="changeType">
                    {{ type === 'login' ? '去注册' : '去登录' }}
                </n-button>
                <nuxt-link to="/forget" class="link">忘记密码？</nuxt-link>
            </div>
        </div>
        <div>
            <n-button  v-if="type === 'login'"  class="submit-button" type="primary" @click="onSubmit" :loading="loading">
                登录
            </n-button>
            <n-button v-if="type != 'login'" :uniqueId="form.uniqueId"  class="submit-button" type="primary" :disabled="!form.email || !form.username || !form.password || !form.repassword || !form.uniqueId " @click="onSubmit" :loading="loading">
                注册 
            </n-button>
        </div>
        <div class="agreement-container">
            注册即同意
            <n-button quaternary type="primary" size="tiny">《服务协议》</n-button>
            和
            <n-button quaternary type="primary" size="tiny">《隐私政策》</n-button>
        </div>
    </n-form>
</template>

<script setup>
import {
    NForm,
    NFormItem,
    NInput,
    NButton,
    createDiscreteApi
} from "naive-ui"

const route = useRoute()

const type = ref("login")
const title = ref("登录")
useHead({ title })

const formRef = ref(null)
const form = reactive({
    username: "",
    password: "",
    repassword: "",
    email:"",
    uniqueId:""
})

// 表单验证规则
const rules = computed(() => {
    let r = {
        username: [{
            required: true,
            message: '请输入用户名'
        }],
        password: [{
            required: true,
            message: "请输入密码"
        }],
        repassword: [{
            required: true,
            message: "请输入确认密码"
        }],
        email: [{
            required: true,
            message: "请输入邮箱"
        },{
            // 邮箱格式校验规则
            validator: (_rule, value) => {
                const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
                return isEmail;
            },
            message: "请输入有效邮箱格式",
            trigger: ["input", "blur"]
        }],
        uniqueId: [{
            required: true,
            message: "请输入uniqueId"
        }]
    }

    // 注册时添加额外的验证规则
    if (type.value != "login") {
        // 用户名：4-20 位字母、数字、下划线组成，字母开头
        r.username.push({
            validator: (_rule, value) => {
                return /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value);
            },
            message: "用户名必须是4-20位字母、数字、下划线组成，且以字母开头",
            trigger: ["input", "blur"]
        })

        // 密码：8-20 位，必须包含大小写字母、数字，可包含特殊符号
        r.password.push({
            validator: (_rule, value) => {
                if (value.length < 8 || value.length > 20) return false
                const hasUpperCase = /[A-Z]/.test(value)
                const hasLowerCase = /[a-z]/.test(value)
                const hasNumber = /[0-9]/.test(value)
                return hasUpperCase && hasLowerCase && hasNumber
            },
            message: "密码必须是8-20位，且包含大小写字母和数字",
            trigger: ["input", "blur"]
        })

        r.repassword = [{
            required: true,
            message: "请输入确认密码"
        }, {
            validator(_rule, value) {
                return value === form.password
            },
            message: "两次密码输入不一致",
            trigger: ["input", "blur"]
        }]
    }

    return r
})

// 切换登录和注册
const changeType = () => {
    type.value = type.value === 'login' ? 'reg' : 'login'
    title.value = type.value == 'login' ? '登录' : '注册'
    
    route.meta.title = title.value

    form.username = ""
    form.password = ""
    form.repassword = ""
    form.email = ""
    form.uniqueId = ""
    // 还原验证状态
    formRef.value.restoreValidation()
}

const loading = ref(false)
const onSubmit = () => {
    formRef.value.validate(async (errors) => {
        if (errors) return
        
        loading.value = true

        let {
            data,
            error
        } = type.value === 'login' ? await useLoginApi(form) : await useRegApi(form.uniqueId)

        loading.value = false
        
        if (error.value) return

        // nav ui 的创建api
        const { message } = createDiscreteApi(["message"])
        const result = data.value
        if(result != null) {
            message.success(type.value === "login" ? "登录成功" : "注册成功")
        } else {
            message.error(type.value === "reg" ? "注册失败" : "登录失败")
        }

        if (type.value === "login") {
            if (!result?.token) {
                message.error("登录失败，请检查账号状态后重试")
                return
            }
            // Nuxt 提供的 cookie 管理工具
            const token = useCookie("token")
            token.value = result.token
            // 存储用户信息
            const user = useUser()
            user.value = result
            // 单独存权限列表，避免 getinfo 覆盖后丢失
            const permissions = usePermissions()
            permissions.value = result.permissionList || []
            // 持久化到 localStorage，刷新后不丢失
            savePermissions(result.permissionList || [])
            // 持久化 role 信息（含 level），刷新后不丢失
            if (process.client && result.role) {
              localStorage.setItem('__user_role__', JSON.stringify(result.role))
            }
            // 持久化 asset（金币、积分），刷新后不丢失
            if (process.client && result.asset) {
              localStorage.setItem('__user_asset__', JSON.stringify(result.asset))
            }

            // 如果有 from 参数，跳转到该页面
            // 例：/login?from=/user → 跳转到 /user
            navigateTo(route.query.from || "/", { replace: true })
        } else {
            changeType()
        }
    })
}


useEnterEvent(()=>onSubmit())


definePageMeta({
    layout: "login"
})
</script>


<style scoped>
.login-form {
    width: 100%;
}

/* 主按钮样式 */
.submit-button {
    width: 100%;
    background-color: #007bff !important;
    border-color: #007bff !important;
    color: white !important;
    font-weight: 500;
    border-radius: 4px;
    padding: 0.75rem 0;
    margin-top: 1rem;
    font-size: 1rem;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
}

/* 悬停效果 */
.submit-button:hover {
    background-color: #0056b3 !important;
    border-color: #0056b3 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

/* 输入框样式 */
.n-input {
    border-radius: 4px;
    border: 1px solid #d1d5da;
    transition: border-color 0.2s ease;
    font-size: 0.95rem;
}

/* 输入框聚焦状态 */
.n-input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

/* 链接样式 */
.button-container {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
}

.links {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.link {
    color: #007bff;
    font-size: 0.875rem;
    text-decoration: none;
    padding: 0.25rem 0;
    font-weight: 400;
    transition: color 0.2s ease;
}

.link:hover {
    text-decoration: underline;
    color: #0056b3;
}

.agreement-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    font-size: 0.75rem;
    margin-top: 1.25rem;
    color: #6b7280;
    line-height: 1.5;
}

.agreement-container .n-button {
    color: #007bff;
    padding: 0;
    margin: 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 400;
}

/* 去登录和注册按钮样式 */
.go-to-button{
    color: #007bff;
    font-size: 0.9rem;
}

.go-to-button:hover{
    color: #007bff;
}
</style>
