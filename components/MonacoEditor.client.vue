<template>
  <div ref="containerRef" class="monaco-editor-container" :style="{ height }">
    <div v-if="!ready" class="monaco-placeholder">Loading editor…</div>
  </div>
</template>

<script setup>
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker     from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import jsonWorker   from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker    from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker   from 'monaco-editor/esm/vs/language/html/html.worker?worker'

// ---- environment must be set BEFORE any monaco import ----
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json')           return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  language:    { type: String, default: 'shell' },
  readOnly:    { type: Boolean, default: false },
  height:      { type: String, default: '300px' }
})

const emit   = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const ready        = ref(false)

let monacoModule   = null  // the monaco namespace (set after dynamic import)
let editorInstance = null

// ---- helpers ----
function createEditor() {
  if (!containerRef.value || !monacoModule) return

  editorInstance = monacoModule.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readOnly,
    theme: 'vs-dark',
    fontSize: 13,
    lineNumbers: 'on',
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    renderWhitespace: 'selection',
    folding: true,
    glyphMargin: false,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 3,
    padding: { top: 8, bottom: 8 }
  })

  editorInstance.onDidChangeModelContent(() => {
    const val = editorInstance.getValue()
    if (val !== props.modelValue) emit('update:modelValue', val)
  })
}

// ---- watchers ----
watch(() => props.modelValue, (v) => {
  if (editorInstance && v !== editorInstance.getValue()) editorInstance.setValue(v)
})
watch(() => props.language, (lang) => {
  if (editorInstance) {
    const m = editorInstance.getModel()
    if (m && monacoModule) monacoModule.editor.setModelLanguage(m, lang)
  }
})
watch(() => props.readOnly, (v) => {
  if (editorInstance) editorInstance.updateOptions({ readOnly: v })
})

// ---- lifecycle ----
onMounted(async () => {
  try {
    // dynamic import – only runs in the browser (this is a .client.vue)
    monacoModule = await import('monaco-editor')
    createEditor()
  } catch (e) {
    console.error('[MonacoEditor] failed to load monaco-editor:', e)
  } finally {
    ready.value = true
  }
})

onBeforeUnmount(() => {
  editorInstance?.dispose()
  editorInstance = null
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.monaco-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 13px;
  background: #1e1e1e;
}
</style>
