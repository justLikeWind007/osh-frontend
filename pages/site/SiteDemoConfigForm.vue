<template>
  <div class="demo-config-form">
    <n-form label-placement="left" label-width="90px">
      <n-form-item label="编辑模式">
        <n-radio-group v-model:value="demoConfigMode">
          <n-radio value="form">表单模式</n-radio>
          <n-radio value="json">JSON模式</n-radio>
        </n-radio-group>
      </n-form-item>
    </n-form>

    <!-- 表单模式 -->
    <template v-if="demoConfigMode === 'form'">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <!-- Tab 1: 基本配置 -->
        <n-tab-pane name="basic" tab="基本配置">
          <div class="pane-inner" :class="{ 'pane-inner--active': activeTab === 'basic' }">
          <n-form label-placement="left" label-width="90px">
            <n-form-item label="前端地址">
              <n-input v-model:value="demoConfig.frontendUrl" placeholder="如 https://demo.example.com" />
            </n-form-item>

            <n-divider title-placement="left" style="margin: 12px 0;">SSH 服务器配置</n-divider>

            <n-form-item label="后端服务器IP">
              <n-input v-model:value="demoConfig.backendHost" placeholder="如 192.168.1.100" />
            </n-form-item>
            <n-form-item label="SSH端口">
              <n-input-number v-model:value="demoConfig.backendPort" :min="1" :max="65535" placeholder="22" />
            </n-form-item>
            <n-form-item label="SSH用户名">
              <n-input v-model:value="demoConfig.backendUser" placeholder="如 root" />
            </n-form-item>
            <n-form-item label="登录方式">
              <n-radio-group v-model:value="demoConfig.loginMethod">
                <n-radio value="password">密码</n-radio>
                <n-radio value="privateKey">私钥</n-radio>
              </n-radio-group>
            </n-form-item>
            <n-form-item v-if="demoConfig.loginMethod === 'password'" label="SSH密码">
              <n-input v-model:value="demoConfig.backendPassword" type="password" placeholder="请输入SSH密码" />
            </n-form-item>
            <n-form-item v-if="demoConfig.loginMethod === 'privateKey'" label="SSH私钥">
              <n-input v-model:value="demoConfig.privateKey" type="textarea" :autosize="{ minRows: 4, maxRows: 10 }" placeholder="请粘贴 SSH 私钥（PEM 格式）" />
            </n-form-item>
          </n-form>
          </div>
        </n-tab-pane>

        <!-- Tab 2: 启动脚本 -->
        <n-tab-pane name="startup" tab="启动脚本">
          <div class="pane-inner" :class="{ 'pane-inner--active': activeTab === 'startup' }">
          <div class="script-tab-header">
            <n-form-item label="脚本语言" label-placement="left" label-width="70px" style="margin-bottom: 8px;">
              <n-select
                v-model:value="startupScriptLanguage"
                :options="scriptLanguageOptions"
                style="width: 160px;"
                size="small"
              />
            </n-form-item>
          </div>
          <MonacoEditor
            v-model="demoConfig.startupScript"
            :language="startupScriptLanguage"
            height="320px"
          />
          </div>
        </n-tab-pane>

        <!-- Tab 3: 健康检查脚本 -->
        <n-tab-pane name="healthcheck" tab="健康检查脚本">
          <div class="pane-inner" :class="{ 'pane-inner--active': activeTab === 'healthcheck' }">
          <div class="script-tab-header">
            <n-form-item label="脚本语言" label-placement="left" label-width="70px" style="margin-bottom: 8px;">
              <n-select
                v-model:value="healthCheckScriptLanguage"
                :options="scriptLanguageOptions"
                style="width: 160px;"
                size="small"
              />
            </n-form-item>
          </div>
          <MonacoEditor
            v-model="demoConfig.healthCheckScript"
            :language="healthCheckScriptLanguage"
            height="320px"
          />
          </div>
        </n-tab-pane>

        <!-- Tab 4: 停止脚本 -->
        <n-tab-pane name="stop" tab="停止脚本">
          <div class="pane-inner" :class="{ 'pane-inner--active': activeTab === 'stop' }">
          <div class="script-tab-header">
            <n-form-item label="脚本语言" label-placement="left" label-width="70px" style="margin-bottom: 8px;">
              <n-select
                v-model:value="stopScriptLanguage"
                :options="scriptLanguageOptions"
                style="width: 160px;"
                size="small"
              />
            </n-form-item>
          </div>
          <MonacoEditor
            v-model="demoConfig.stopScript"
            :language="stopScriptLanguage"
            height="320px"
          />
          </div>
        </n-tab-pane>

        <!-- Tab 5: 登录凭证 -->
        <n-tab-pane name="credentials" tab="登录凭证">
          <div class="pane-inner" :class="{ 'pane-inner--active': activeTab === 'credentials' }">
          <n-form label-placement="left" label-width="90px">
            <n-form-item label="默认用户名">
              <n-input v-model:value="demoConfig.loginUsername" placeholder="如 admin" />
            </n-form-item>
            <n-form-item label="默认密码">
              <n-input v-model:value="demoConfig.loginPassword" type="password" placeholder="请输入演示站点默认登录密码" />
            </n-form-item>
          </n-form>
          </div>
        </n-tab-pane>
      </n-tabs>
    </template>

    <!-- JSON模式 -->
    <template v-else>
      <div style="margin-top: 12px;">
        <MonacoEditor
          v-model="jsonEditText"
          language="json"
          height="380px"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  NInput, NInputNumber, NForm, NFormItem, NRadioGroup, NRadio, NDivider,
  NTabs, NTabPane, NSelect
} from 'naive-ui'

const props = defineProps({
  siteConfig: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:siteConfig'])

// 演示配置 - 表单模式
const demoConfig = reactive({
  frontendUrl: '',
  backendHost: '',
  backendPort: 22,
  backendUser: '',
  loginMethod: 'password',
  backendPassword: '',
  privateKey: '',
  startupScript: '',
  healthCheckScript: '',
  stopScript: '',
  loginUsername: '',
  loginPassword: ''
})

// 编辑模式：form | json
const demoConfigMode = ref('form')

// JSON 编辑文本
const jsonEditText = ref('')

// 当前激活的 Tab
const activeTab = ref('basic')

// 脚本语言选择
const startupScriptLanguage = ref('shell')
const healthCheckScriptLanguage = ref('shell')
const stopScriptLanguage = ref('shell')
const scriptLanguageOptions = [
  { label: 'Shell (bash)', value: 'shell' },
  { label: 'Python', value: 'python' }
]

// 从 prop 对象初始化 demoConfig
watch(() => props.siteConfig, (val) => {
  if (val && typeof val === 'object' && Object.keys(val).length > 0) {
    Object.assign(demoConfig, {
      frontendUrl: val.frontendUrl || '',
      backendHost: val.backendHost || '',
      backendPort: val.backendPort || 22,
      backendUser: val.backendUser || '',
      loginMethod: val.loginMethod || 'password',
      backendPassword: val.backendPassword || '',
      privateKey: val.privateKey || '',
      startupScript: val.startupScript || '',
      healthCheckScript: val.healthCheckScript || '',
      stopScript: val.stopScript || '',
      loginUsername: val.loginUsername || '',
      loginPassword: val.loginPassword || ''
    })
  } else {
    Object.assign(demoConfig, {
      frontendUrl: '',
      backendHost: '',
      backendPort: 22,
      backendUser: '',
      loginMethod: 'password',
      backendPassword: '',
      privateKey: '',
      startupScript: '',
      healthCheckScript: '',
      stopScript: '',
      loginUsername: '',
      loginPassword: ''
    })
  }
  jsonEditText.value = JSON.stringify(props.siteConfig || {}, null, 2)
}, { immediate: true, deep: true })

// 表单模式 → 将 demoConfig 对象 emit 出去
watch(demoConfig, (val) => {
  if (demoConfigMode.value === 'form') {
    emit('update:siteConfig', { ...val })
  }
}, { deep: true })

// 切换模式时同步数据
watch(demoConfigMode, (mode) => {
  if (mode === 'form') {
    // 切到表单：解析 JSON 文本 → demoConfig
    try {
      const parsed = JSON.parse(jsonEditText.value)
      Object.assign(demoConfig, {
        frontendUrl: parsed.frontendUrl || '',
        backendHost: parsed.backendHost || '',
        backendPort: parsed.backendPort || 22,
        backendUser: parsed.backendUser || '',
        loginMethod: parsed.loginMethod || 'password',
        backendPassword: parsed.backendPassword || '',
        privateKey: parsed.privateKey || '',
        startupScript: parsed.startupScript || '',
        healthCheckScript: parsed.healthCheckScript || '',
        stopScript: parsed.stopScript || '',
        loginUsername: parsed.loginUsername || '',
        loginPassword: parsed.loginPassword || ''
      })
    } catch (e) { /* ignore */ }
  } else {
    // 切到JSON：demoConfig → JSON 文本
    jsonEditText.value = JSON.stringify({
      frontendUrl: demoConfig.frontendUrl,
      backendHost: demoConfig.backendHost,
      backendPort: demoConfig.backendPort,
      backendUser: demoConfig.backendUser,
      loginMethod: demoConfig.loginMethod,
      backendPassword: demoConfig.backendPassword,
      privateKey: demoConfig.privateKey,
      startupScript: demoConfig.startupScript,
      healthCheckScript: demoConfig.healthCheckScript,
      stopScript: demoConfig.stopScript,
      loginUsername: demoConfig.loginUsername,
      loginPassword: demoConfig.loginPassword
    }, null, 2)
  }
})

// JSON 编辑文本变更 → 解析后 emit
watch(jsonEditText, (val) => {
  if (demoConfigMode.value === 'json') {
    try {
      const parsed = JSON.parse(val)
      emit('update:siteConfig', parsed)
    } catch (e) { /* invalid JSON, ignore */ }
  }
})
</script>

<style scoped>
.demo-config-form {
  padding: 4px 0;
}

.script-tab-header {
  margin-bottom: 4px;
}

/* ---- prevent layout thrash when switching Monaco tabs ---- */

/*
 * Naive UI uses inline style="display:none" on inactive n-tab-pane
 * which collapses the layout. Force every pane to stay in flow,
 * then use .pane-inner visibility to show/hide without resizing.
 */
.demo-config-form :deep(.n-tabs-pane-wrapper) {
  position: relative;
  min-height: 400px;
}

.demo-config-form :deep(.n-tab-pane) {
  padding-top: 12px;
  display: block !important;
}

/* All inner wrappers are stacked at the same position */
.pane-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  visibility: hidden;
  pointer-events: none;
}

/* Only the active one flows normally and is visible */
.pane-inner--active {
  position: relative;
  visibility: visible;
  pointer-events: auto;
}
</style>
