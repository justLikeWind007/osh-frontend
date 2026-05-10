<template>
  <div class="qa-panel">
    <div v-if="description" class="panel-desc">{{ description }}</div>

    <div v-if="disabledReason" class="panel-alert">
      <div>{{ disabledReason }}</div>
      <button v-if="showLoginAction" class="login-btn" type="button" @click="onLogin?.()">去登录</button>
    </div>

    <div v-if="suggestions?.length" class="suggestion-wrap">
      <button
        v-for="item in suggestions"
        :key="item"
        class="suggestion-chip"
        type="button"
        @click="fillSuggestion(item)"
      >
        {{ item }}
      </button>
    </div>

    <div class="messages">
      <div
        v-for="(message, index) in messages"
        :key="`${message.role}-${index}-${message.content}`"
        class="message-row"
        :class="message.role"
      >
        <div class="message-bubble">
          {{ message.content }}
        </div>
      </div>
    </div>

    <div class="composer">
      <textarea
        v-model="draft"
        class="composer-input"
        :disabled="sending || disabled"
        :placeholder="placeholder"
        rows="3"
        @keydown.enter.exact.prevent="submit"
      />
      <button class="send-btn" type="button" :disabled="sending || disabled || !draft.trim()" @click="submit">
        {{ sending ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  description: {
    type: String,
    default: '',
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
  messages: {
    type: Array,
    default: () => [],
  },
  sending: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledReason: {
    type: String,
    default: '',
  },
  showLoginAction: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '输入你的问题',
  },
  onSend: {
    type: Function,
    default: null,
  },
  onLogin: {
    type: Function,
    default: null,
  },
})

const draft = ref('')

function fillSuggestion(value) {
  draft.value = value
}

function submit() {
  const value = draft.value.trim()
  if (!value || props.disabled || props.sending) return
  props.onSend?.(value)
  draft.value = ''
}
</script>

<style scoped>
.qa-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.panel-alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 12px;
  line-height: 1.6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.login-btn {
  border: none;
  border-radius: 10px;
  background: #ea580c;
  color: #fff;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.suggestion-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.suggestion-chip {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.messages {
  flex: 1;
  margin-top: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

.message-row {
  display: flex;
  margin-bottom: 10px;
}

.message-row.assistant {
  justify-content: flex-start;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 88%;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row.assistant .message-bubble {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.message-row.user .message-bubble {
  background: #1d4ed8;
  color: #fff;
}

.composer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.composer-input {
  width: 100%;
  resize: none;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
}

.composer-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.send-btn {
  margin-top: 10px;
  width: 100%;
  border: none;
  border-radius: 12px;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
  cursor: pointer;
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: .55;
}
</style>
