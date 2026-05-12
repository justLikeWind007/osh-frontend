<template>
  <n-grid :x-gap="20">
    <n-grid-item :span="18">
      <n-card>
        <template #header>
          <h3 class="text-center font-bold">{{ data.title }}</h3>
          <n-divider />
          <p class="space-x-5 text-sm text-center">
            <span>题目总数：{{ data.testpaper_questions.length }}</span>
            <span>总分数：{{ data.total_score }}</span>
            <span>时间：{{ data.expire }}分钟</span>
          </p>
          <div
            v-if="showQuestionAdmin"
            class="paper-q-admin flex justify-center mt-3"
          >
            <n-button size="small" type="primary" @click="openQuestionCreate">
              添加题目
            </n-button>
          </div>
        </template>

        <!-- 题目组件 -->
        <PaperTestItem
          v-for="(item, index) in testpaper_questions"
          :key="item.id ?? item.question_id ?? index"
          :item="item"
          :index="index"
          :show-question-admin="showQuestionAdmin"
          @change="handleUserValueChange(item, $event)"
          @question-edit="openQuestionEdit"
          @question-delete="handleQuestionDelete"
          :id="'question_' + index"
        />
      </n-card>
    </n-grid-item>
    <n-grid-item :span="6">
      <n-card>
        <template #header>
          <div class="flex flex-col items-center justify-center">
            <small class="text-gray-500 mb-1">剩余时间</small>
            <TimeBox
              :expire="data.expire"
              class="text-3xl text-light-blue-600"
              @end="autoSubmit"
            />
          </div>
        </template>
        <n-grid :x-gap="12" :cols="4">
          <n-grid-item
            v-for="(item, index) in testpaper_questions"
            :key="index"
          >
            <n-tag
              class="mb-2 w-full cursor-pointer flex items-center justify-center"
              :type="item.isTest ? 'success' : ''"
              @click="scrollToDom(index)"
              >{{ index + 1 }}</n-tag
            >
          </n-grid-item>
        </n-grid>
        <n-divider />
        <div>
          <n-button
            type="primary"
            class="w-full"
            @click="submit"
            :loading="loading"
            >交 卷</n-button
          >
        </div>
      </n-card>
    </n-grid-item>
  </n-grid>

  <ExamQuestionEditModal
    v-model:show="questionModalVisible"
    :exam-id="Number(route.params.id)"
    :init-question="questionModalInit"
    @success="reloadExamDetail"
  />
</template>

<style>
/* Custom CSS to replace Windi CSS utilities */
.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.space-x-5 > *:not(:first-child) {
  margin-left: 0.3125rem; /* 5px equivalent */
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1rem;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.text-gray-500 {
  color: #6b7280;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.text-light-blue-600 {
  color: #0ea5e9;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.w-full {
  width: 100%;
}

.cursor-pointer {
  cursor: pointer;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>

<script setup>
import { computed, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import {
  NGrid,
  NGridItem,
  NButton,
  NTag,
  NCard,
  NDivider,
  createDiscreteApi,
} from 'naive-ui';
import {
  apiReadExam,
  apiSubmitExam,
  apiDeleteExamQuestion,
} from '~/composables/Api/Exam/exam';
import { usePermission } from '~/composables/usePermission';
import { canManageExamByRoleLevel } from '~/composables/useAuth';
import ExamQuestionEditModal from '~/components/Exam/ExamQuestionEditModal.vue';

const route = useRoute();
const { message: msg, dialog } = createDiscreteApi(['message', 'dialog']);
const { hasPermission } = usePermission();

const showQuestionAdmin = computed(
  () =>
    hasPermission('exam:question:save') ||
    hasPermission('exam:question:delete') ||
    hasPermission('exam:update') ||
    hasPermission('exam:delete') ||
    canManageExamByRoleLevel()
);

const questionModalVisible = ref(false);
const questionModalInit = ref(null);

function cloneAnswer(val) {
  if (val === undefined) return undefined;
  try {
    return structuredClone(val);
  } catch {
    try {
      return JSON.parse(JSON.stringify(val));
    } catch {
      return val;
    }
  }
}

function snapshotAnswersByQuestionId(questions) {
  const m = new Map();
  for (const q of questions || []) {
    const id = q.id ?? q.question_id;
    if (id == null) continue;
    m.set(Number(id), cloneAnswer(q.user_value));
  }
  return m;
}

function applySnapshotAnswers(questions, snap) {
  for (const q of questions || []) {
    const id = Number(q.id ?? q.question_id);
    if (snap.has(id)) q.user_value = snap.get(id);
  }
}

// 用新 API 加载试卷（修复了 user_test_id 硬编码）
let examData = null;
try {
  const res = await apiReadExam(route.params.id);
  if (res?.code === 200) {
    examData = res.data;
  } else {
    msg.error(res?.msg || '加载失败');
    await navigateTo('/paper/1');
  }
} catch (e) {
  msg.error(e?.data?.msg || '加载失败，请检查网络');
  await navigateTo('/paper/1');
}

const data = ref(examData);

async function reloadExamDetail() {
  const snap = snapshotAnswersByQuestionId(data.value?.testpaper_questions);
  try {
    const res = await apiReadExam(route.params.id);
    if (res?.code === 200 && res.data) {
      applySnapshotAnswers(res.data.testpaper_questions, snap);
      data.value = res.data;
      updateIsTest();
    } else {
      msg.error(res?.msg || '刷新失败');
    }
  } catch (e) {
    msg.error(e?.data?.msg || '刷新失败');
  }
}

function openQuestionCreate() {
  questionModalInit.value = null;
  questionModalVisible.value = true;
}

function openQuestionEdit(item) {
  questionModalInit.value = { ...item };
  questionModalVisible.value = true;
}

function handleQuestionDelete(item) {
  const qid = item.id ?? item.question_id;
  const examId = Number(route.params.id);
  dialog.warning({
    title: '删除题目',
    content: '确定删除该题目？删除后不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        const res = await apiDeleteExamQuestion(qid, examId);
        if (res?.code === 200) {
          msg.success('已删除');
          await reloadExamDetail();
          return true;
        }
        msg.error(res?.msg || '删除失败');
        return false;
      } catch (e) {
        msg.error(e?.data?.msg || '删除失败');
        return false;
      }
    },
  });
}

// 题目列表
const testpaper_questions = computed(() => {
  return data.value
    ? data.value.testpaper_questions.map((o) => {
        o.isTest = false;
        return o;
      })
    : [];
});

// 监听题目值变化
function handleUserValueChange(item, val) {
  item.user_value = val;
  updateIsTest();
}

// 检查题目是否填写
function updateIsTest() {
  testpaper_questions.value.forEach((item) => {
    let t = false;
    // 问答和填空
    if (item.type == 'answer' || item.type == 'completion') {
      t = !!item.user_value[0];
    }
    // 单选
    else if (item.type == 'radio' || item.type == 'trueOrfalse') {
      t = item.user_value != -1;
    }
    // 多选
    else {
      t = item.user_value.length > 0;
    }

    item.isTest = t;
  });
}

// 滚动到指定位置
function scrollToDom(index) {
  const dom = document.getElementById('question_' + index);
  window.scrollTo(0, dom.offsetTop);
}

// 阻止切换其他页面
// 仅对真正在考试的用户拦截后退；管理员（题目管理）走的是出题/编辑流程，
// 拦截会让浏览器左上角的后退箭头看起来失灵（弹窗常被新增/编辑题目弹窗遮住）。
const disableBack = ref(true);
onBeforeRouteLeave((to, from, next) => {
  if (showQuestionAdmin.value || !disableBack.value) {
    next();
    return;
  }
  const { dialog: d } = createDiscreteApi(['dialog']);
  d.warning({
    content: '是否要放弃考试？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick() {
      disableBack.value = false;
      navigateTo(to.fullPath || '/', { replace: true });
    },
  });
  next(false);
});

// 交卷
const loading = ref(false);
async function submit() {
  const { message: m } = createDiscreteApi(['message']);
  let l = testpaper_questions.value.filter((v) => !v.isTest).length;
  if (l > 0) {
    return m.warning('还有题目没有完成，请检查');
  }

  loading.value = true;

  try {
    const res = await apiSubmitExam({
      user_test_id: data.value.user_test_id, // 后端返回的真实考试记录ID
      exam_id: Number(route.params.id),
      value: testpaper_questions.value.map((o) => o.user_value),
    });

    if (res?.code === 200) {
      disableBack.value = false;
      m.success('交卷成功');
      navigateTo('/paper/1', { replace: true });
    } else {
      m.error(res?.msg || '交卷失败，请重试');
    }
  } catch (e) {
    m.error(e?.data?.msg || '交卷失败，请检查网络');
  } finally {
    loading.value = false;
  }
}

// 自动交卷
function autoSubmit() {
  const { dialog: d } = createDiscreteApi(['dialog']);
  d.success({
    content: '考试时间到，试卷已强制提交',
    positiveText: '确认',
    closable: false,
    onPositiveClick() {
      disableBack.value = false;
      navigateTo('/paper/1', { replace: true });
    },
  });
}

definePageMeta({
  middleware: ['auth', 'exam-vip'],
});
</script>
